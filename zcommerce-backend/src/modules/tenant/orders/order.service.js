import { withTransaction } from '../../../app/database/transaction.js';
import { db } from '../../../app/database/connection.js';
import { scoped } from '../../../app/tenant/tenant-scope.js';
import { getTenant, getTenantId } from '../../../app/tenant/tenant-context.js';
import { NotFoundError } from '../../../shared/exceptions/index.js';
import { enqueueEmail } from '../../../jobs/queues/index.js';
import { logger } from '../../../shared/utils/logger.js';

const STOCK_RELEASING = ['cancelled', 'refunded'];

export const presentOrderItem = (i) => ({
  id: i.id,
  product_id: i.product_id,
  name: i.name,
  sku: i.sku,
  image_url: i.image_url,
  unit_price: i.unit_price,
  quantity: i.quantity,
  line_total: i.line_total,
});

/** Store (customer-facing) order shape from CONTRACT.md. */
export function presentStoreOrder(order, items = []) {
  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    fulfillment_status: order.fulfillment_status,
    email: order.email,
    phone: order.phone,
    currency: order.currency,
    subtotal: order.subtotal,
    discount_total: order.discount_total,
    shipping_total: order.shipping_total,
    tax_total: order.tax_total,
    grand_total: order.grand_total,
    coupon_code: order.coupon_code,
    shipping_method_name: order.shipping_method_name,
    shipping_address: order.shipping_address,
    billing_address: order.billing_address,
    payment_method: order.payment_method,
    notes: order.notes,
    tracking_number: order.tracking_number,
    items: items.map(presentOrderItem),
    placed_at: order.placed_at,
    created_at: order.created_at,
  };
}

export class OrderService {
  constructor({ orderRepository, inventoryRepository, settingService }) {
    this.repo = orderRepository;
    this.inventory = inventoryRepository;
    this.settings = settingService;
  }

  presentListItem(row) {
    const { customer_name, ...o } = row;
    return { ...o, customer: o.customer_id ? { id: o.customer_id, name: customer_name } : null };
  }

  async list(query) {
    const { data, meta } = await this.repo.list(query);
    return { data: data.map((r) => this.presentListItem(r)), meta };
  }

  async get(id) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundError('Order not found');
    const [items, history, payments, customer] = await Promise.all([
      this.repo.items(id),
      this.repo.history(id),
      this.repo.payments(id),
      this.repo.customer(order.customer_id),
    ]);
    const { customer_name, ...rest } = order;
    return { ...rest, items: items.map(presentOrderItem), history, payments, customer: customer || null };
  }

  /** Put stock back for every item (cancel/refund). */
  async restock(order, userId, trx) {
    const items = await this.repo.items(order.id, trx);
    for (const item of items) {
      if (!item.product_id) continue;
      const product = await this.inventory.lockProduct(item.product_id, trx);
      if (!product || !product.track_inventory) continue;
      await this.inventory.setStock(product.id, product.stock_quantity + item.quantity, trx);
      await this.inventory.addMovement(
        { product_id: product.id, type: 'return', quantity: item.quantity, reason: `Order #${order.order_number} ${order.status}`, reference: order.order_number, created_by: userId },
        trx,
      );
    }
  }

  async updateStatus(id, { status, note, tracking_number }, user) {
    const updated = await withTransaction(async (trx) => {
      const order = await this.repo.query(trx).where('orders.id', id).forUpdate().first();
      if (!order) throw new NotFoundError('Order not found');
      const patch = { status };
      if (tracking_number !== undefined) patch.tracking_number = tracking_number || null;
      if (status === 'delivered') {
        patch.fulfillment_status = 'fulfilled';
        if (order.payment_method === 'cod' && order.payment_status === 'pending') patch.payment_status = 'paid';
      }
      if (status === 'shipped') patch.fulfillment_status = 'fulfilled';
      if (status === 'cancelled') patch.cancelled_at = new Date();
      if (status === 'refunded') patch.payment_status = 'refunded';

      if (STOCK_RELEASING.includes(status) && !STOCK_RELEASING.includes(order.status)) {
        await this.restock({ ...order, status }, user?.id || null, trx);
        // Cancelled/refunded orders no longer count toward the customer's totals.
        if (order.customer_id) {
          await scoped('customers', trx)
            .where('customers.id', order.customer_id)
            .update({ orders_count: db.raw('greatest(orders_count - 1, 0)'), total_spent: db.raw('greatest(total_spent - ?, 0)', [order.grand_total]) });
        }
      }
      await this.repo.update(id, patch, trx);
      if (patch.payment_status) {
        await this.repo.updatePayments(id, { status: patch.payment_status, ...(patch.payment_status === 'paid' ? { paid_at: new Date() } : {}) }, trx);
      }
      await this.repo.addHistory({ order_id: id, status, note: note || null, created_by: user?.id || null }, trx);
      return { ...order, ...patch };
    });

    this.notifyCustomer(updated).catch((err) => logger.warn({ err: err.message }, 'order status email failed'));
    return this.get(id);
  }

  async notifyCustomer(order) {
    if (!['confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) return;
    const prefs = await this.settings.getGroup(getTenantId(), 'notifications');
    if (!prefs.customer_order_emails) return;
    const general = await this.settings.getGroup(getTenantId(), 'general');
    await enqueueEmail('order.status', { order, store_name: general.store_name || getTenant()?.name });
  }

  async updatePaymentStatus(id, { payment_status }, user) {
    await withTransaction(async (trx) => {
      const order = await this.repo.query(trx).where('orders.id', id).forUpdate().first();
      if (!order) throw new NotFoundError('Order not found');
      await this.repo.update(id, { payment_status }, trx);
      await this.repo.updatePayments(id, { status: payment_status, paid_at: payment_status === 'paid' ? new Date() : null }, trx);
      await this.repo.addHistory({ order_id: id, status: order.status, note: `Payment marked as ${payment_status}`, created_by: user?.id || null }, trx);
    });
    return this.get(id);
  }
}
