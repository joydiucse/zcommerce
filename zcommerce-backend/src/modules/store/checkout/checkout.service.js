import { withTransaction } from '../../../app/database/transaction.js';
import { getTenant, getTenantId } from '../../../app/tenant/tenant-context.js';
import { calculateTotals } from '../../../shared/helpers/order-totals.js';
import { ForbiddenError, ValidationError } from '../../../shared/exceptions/index.js';
import { enqueueEmail } from '../../../jobs/queues/index.js';
import { logger } from '../../../shared/utils/logger.js';
import { buildCartLines } from '../cart/cart.service.js';
import { presentStoreOrder } from '../../tenant/orders/order.service.js';

export class CheckoutService {
  constructor({
    checkoutRepository,
    cartService,
    storeProductRepository,
    couponRepository,
    orderRepository,
    inventoryRepository,
    inventoryService,
    notificationService,
    storeCustomerRepository,
    settingService,
  }) {
    this.repo = checkoutRepository;
    this.carts = cartService;
    this.products = storeProductRepository;
    this.coupons = couponRepository;
    this.orders = orderRepository;
    this.inventoryRepo = inventoryRepository;
    this.inventory = inventoryService;
    this.notifications = notificationService;
    this.customers = storeCustomerRepository;
    this.settings = settingService;
  }

  async requireCart(token) {
    const cart = await this.carts.load(token);
    if (!cart) throw ValidationError.field('cart_token', 'Cart not found or expired');
    if (!cart.items.length) throw ValidationError.field('cart_token', 'Your cart is empty');
    return cart;
  }

  /** Active shipping methods with the computed cost for this cart. */
  async shippingMethods(cartToken) {
    const methods = await this.repo.activeShippingMethods();
    const cart = cartToken ? await this.carts.load(cartToken) : null;
    const base = cart ? await this.carts.price(cart) : null;
    return methods.map((m) => {
      const totals = base
        ? calculateTotals({ items: base.lines, coupon: base.coupon, shippingMethod: m, checkout: {} })
        : calculateTotals({ items: [], shippingMethod: m });
      return {
        id: m.id,
        name: m.name,
        description: m.description,
        type: m.type,
        rate: m.rate,
        free_over_amount: m.free_over_amount,
        estimated_days: m.estimated_days,
        cost: totals.shipping_total,
      };
    });
  }

  async place(input, customer) {
    const tenantId = getTenantId();
    const [checkoutSettings, general, notifPrefs] = await Promise.all([
      this.settings.getGroup(tenantId, 'checkout'),
      this.settings.getGroup(tenantId, 'general'),
      this.settings.getGroup(tenantId, 'notifications'),
    ]);

    if (!customer && !checkoutSettings.guest_checkout) throw new ForbiddenError('Please sign in to check out');
    if (input.payment_method === 'cod' && !checkoutSettings.cod_enabled) throw ValidationError.field('payment_method', 'Cash on delivery is not available');
    if (input.payment_method === 'manual' && !checkoutSettings.manual_payment_enabled) {
      throw ValidationError.field('payment_method', 'Manual payment is not available');
    }

    const cart = await this.requireCart(input.cart_token);

    const result = await withTransaction(async (trx) => {
      // 1. Lock product rows, then price the cart from the locked rows.
      const productIds = [...new Set(cart.items.map((i) => i.product_id))].sort();
      const products = await this.products.byIds(productIds, trx, { lock: true });
      const lines = buildCartLines(cart, products);
      if (lines.length !== cart.items.length) {
        throw ValidationError.field('items', 'Some products in your cart are no longer available. Please review your cart.');
      }
      const stockIssues = lines
        .filter((l) => l.product.track_inventory && l.quantity > l.product.stock_quantity)
        .map((l) => ({ path: `items.${l.id}`, message: l.product.stock_quantity > 0 ? `Only ${l.product.stock_quantity} of ${l.name} left` : `${l.name} is out of stock` }));
      if (stockIssues.length) throw new ValidationError('Some items are out of stock', stockIssues);

      const shippingMethod = await this.repo.shippingMethod(input.shipping_method_id, trx);
      if (!shippingMethod) throw ValidationError.field('shipping_method_id', 'Please choose a valid shipping method');

      let coupon = null;
      if (cart.coupon_code) coupon = await this.coupons.findByCode(cart.coupon_code, trx, { lock: true });
      const priced = await this.carts.price(cart, { products, coupon: coupon || null, shippingMethod, checkout: checkoutSettings });
      if (cart.coupon_code && priced.couponError) throw ValidationError.field('coupon', priced.couponError);
      const totals = priced.totals;
      if (checkoutSettings.min_order_amount && totals.subtotal < checkoutSettings.min_order_amount) {
        throw ValidationError.field('subtotal', `The minimum order amount is ${general.currency_symbol}${Number(checkoutSettings.min_order_amount).toFixed(2)}`);
      }

      // 2. Customer: logged-in, or find/create a guest customer by email.
      let customerRow = customer ? await this.customers.findById(customer.id, trx) : await this.customers.findByEmail(input.email, trx);
      if (!customerRow) {
        customerRow = await this.customers.create(
          { name: input.shipping_address.name, email: input.email, phone: input.phone || input.shipping_address.phone || null, password_hash: null, addresses: [input.shipping_address] },
          trx,
        );
      }

      // 3. Order + items + history + payment.
      const orderNumber = await this.orders.nextOrderNumber(trx);
      const order = await this.orders.insertOrder(
        {
          customer_id: customerRow.id,
          order_number: orderNumber,
          email: input.email,
          phone: input.phone || input.shipping_address.phone || null,
          status: 'pending',
          payment_status: 'pending',
          fulfillment_status: 'unfulfilled',
          currency: general.currency,
          subtotal: totals.subtotal,
          discount_total: totals.discount_total,
          shipping_total: totals.shipping_total,
          tax_total: totals.tax_total,
          grand_total: totals.grand_total,
          coupon_code: priced.coupon?.code || null,
          shipping_method_id: shippingMethod.id,
          shipping_method_name: shippingMethod.name,
          shipping_address: input.shipping_address,
          billing_address: input.billing_address || input.shipping_address,
          payment_method: input.payment_method,
          notes: input.notes || null,
          placed_at: new Date(),
        },
        trx,
      );

      const items = await this.orders.insertItems(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.product_id,
          name: l.name,
          sku: l.sku,
          image_url: l.image_url,
          unit_price: l.price,
          quantity: l.quantity,
          line_total: l.line_total,
        })),
        trx,
      );
      await this.orders.addHistory({ order_id: order.id, status: 'pending', note: 'Order placed', created_by: null }, trx);
      await this.orders.addPayment(
        { order_id: order.id, method: input.payment_method, amount: totals.grand_total, currency: general.currency, status: 'pending' },
        trx,
      );

      // 4. Inventory: decrement locked rows, write movements, low-stock alerts.
      for (const l of lines) {
        if (!l.product.track_inventory) continue;
        const before = l.product.stock_quantity;
        const after = before - l.quantity;
        await this.repo.decrementStock(l.product_id, l.quantity, trx);
        await this.inventoryRepo.addMovement(
          { product_id: l.product_id, type: 'sale', quantity: -l.quantity, reason: `Order #${orderNumber}`, reference: orderNumber, created_by: null },
          trx,
        );
        await this.inventory.checkLowStock(l.product, before, after, trx);
      }

      // 5. Coupon usage + customer stats + staff notification.
      if (priced.coupon) await this.coupons.incrementUsage(priced.coupon.id, trx);
      await this.repo.recordCustomerOrder(customerRow.id, totals.grand_total, trx);
      await this.notifications.notify(
        {
          type: 'order.placed',
          title: `New order #${orderNumber}`,
          body: `${input.shipping_address.name} placed an order for ${general.currency_symbol}${totals.grand_total.toFixed(2)}`,
          data: { order_id: order.id, order_number: orderNumber, grand_total: totals.grand_total },
        },
        trx,
      );

      return { order, items };
    });

    // After commit: clear cart, queue emails (never fail the checkout for these).
    await this.carts.clear(cart.token).catch(() => {});
    const presented = presentStoreOrder(result.order, result.items);
    const storeName = general.store_name || getTenant()?.name;
    try {
      if (notifPrefs.customer_order_emails) await enqueueEmail('order.confirmation', { order: presented, store_name: storeName });
      const adminEmail = notifPrefs.admin_order_email || general.contact_email;
      if (adminEmail) await enqueueEmail('order.admin', { order: presented, store_name: storeName, to: adminEmail });
    } catch (err) {
      logger.warn({ err: err.message }, 'Failed to enqueue order emails');
    }
    return { order: presented };
  }
}

