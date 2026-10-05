import { randomToken, uuid } from '../../../app/security/hash.js';
import { getTenantId } from '../../../app/tenant/tenant-context.js';
import { calculateTotals, validateCoupon } from '../../../shared/helpers/order-totals.js';
import { round2 } from '../../../shared/utils/index.js';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/index.js';

const MAX_UNTRACKED_QTY = 999;

export const maxQuantityFor = (p) => (p.track_inventory ? Math.max(0, p.stock_quantity) : MAX_UNTRACKED_QTY);

/**
 * Join cart lines with current product rows. Lines whose product is gone/inactive are dropped.
 * Shared by the cart response and checkout so both price identically.
 */
export function buildCartLines(cart, products) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = [];
  for (const item of cart.items) {
    const p = byId.get(item.product_id);
    if (!p || p.status !== 'active') continue;
    const maxQty = maxQuantityFor(p);
    lines.push({
      id: item.id,
      product_id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      image_url: p.images?.[0]?.url || null,
      price: p.price,
      quantity: item.quantity,
      line_total: round2(p.price * item.quantity),
      in_stock: maxQty > 0 && item.quantity <= maxQty,
      max_quantity: maxQty,
      product: p,
    });
  }
  return lines;
}

export class CartService {
  constructor({ cartRepository, storeProductRepository, couponRepository, settingService }) {
    this.repo = cartRepository;
    this.products = storeProductRepository;
    this.coupons = couponRepository;
    this.settings = settingService;
  }

  newCart() {
    const now = new Date().toISOString();
    return { token: randomToken(16), items: [], coupon_code: null, created_at: now, updated_at: now };
  }

  async create() {
    const cart = this.newCart();
    await this.repo.save(getTenantId(), cart);
    return cart;
  }

  async load(token) {
    return (await this.repo.get(getTenantId(), token)) || null;
  }

  /** Existing cart or a fresh one (contract: missing/expired token on a write creates a new cart). */
  async loadOrCreate(token) {
    return (await this.load(token)) || this.create();
  }

  async findCoupon(code, trx = null, opts = {}) {
    return code ? this.coupons.findByCode(code, trx, opts) : null;
  }

  /**
   * Price a cart. Returns { lines, totals, coupon, couponError }.
   * `products` may be passed in (checkout passes locked rows).
   */
  async price(cart, { products = null, coupon = undefined, shippingMethod = null, checkout = null } = {}) {
    const rows = products || (cart.items.length ? await this.products.byIds(cart.items.map((i) => i.product_id)) : []);
    const lines = buildCartLines(cart, rows);
    const checkoutSettings = checkout || (await this.settings.getGroup(getTenantId(), 'checkout'));
    const subtotal = round2(lines.reduce((s, l) => s + l.line_total, 0));

    let validCoupon = null;
    let couponError = null;
    if (cart.coupon_code) {
      const c = coupon !== undefined ? coupon : await this.findCoupon(cart.coupon_code);
      const check = validateCoupon(c, subtotal);
      if (check.valid) validCoupon = c;
      else couponError = check.reason;
    }
    const totals = calculateTotals({ items: lines, coupon: validCoupon, shippingMethod, checkout: checkoutSettings });
    return { lines, totals, coupon: validCoupon, couponError };
  }

  /** Contract cart shape. */
  async present(cart) {
    const { lines, totals, coupon, couponError } = await this.price(cart);
    // Drop stale lines / invalid coupons from the stored cart so the client sees the truth.
    const keep = new Set(lines.map((l) => l.id));
    if (cart.items.some((i) => !keep.has(i.id)) || (cart.coupon_code && couponError)) {
      cart.items = cart.items.filter((i) => keep.has(i.id));
      if (couponError) cart.coupon_code = null;
      await this.repo.save(getTenantId(), cart);
    }
    const general = await this.settings.getGroup(getTenantId(), 'general');
    return {
      token: cart.token,
      items: lines.map(({ product, ...l }) => l),
      item_count: totals.item_count,
      subtotal: totals.subtotal,
      discount_total: totals.discount_total,
      shipping_total: totals.shipping_total,
      tax_total: totals.tax_total,
      grand_total: totals.grand_total,
      coupon: coupon ? { code: coupon.code, type: coupon.type, value: coupon.value } : null,
      currency: general.currency,
    };
  }

  async get(token) {
    return this.present(await this.loadOrCreate(token));
  }

  async addItem(token, { product_id, quantity }) {
    const cart = await this.loadOrCreate(token);
    const [product] = await this.products.byIds([product_id]);
    if (!product || product.status !== 'active') throw new NotFoundError('Product not found');
    const line = cart.items.find((i) => i.product_id === product_id);
    const nextQty = (line?.quantity || 0) + quantity;
    const max = maxQuantityFor(product);
    if (max <= 0) throw ValidationError.field('product_id', `${product.name} is out of stock`);
    if (nextQty > max) throw ValidationError.field('quantity', `Only ${max} of ${product.name} available`);
    if (line) line.quantity = nextQty;
    else cart.items.push({ id: uuid(), product_id, quantity });
    await this.repo.save(getTenantId(), cart);
    return this.present(cart);
  }

  async updateItem(token, itemId, { quantity }) {
    const cart = await this.loadOrCreate(token);
    const line = cart.items.find((i) => i.id === itemId);
    if (!line) throw new NotFoundError('Cart item not found');
    if (quantity === 0) {
      cart.items = cart.items.filter((i) => i.id !== itemId);
    } else {
      const [product] = await this.products.byIds([line.product_id]);
      if (!product || product.status !== 'active') throw new NotFoundError('Product not found');
      const max = maxQuantityFor(product);
      if (quantity > max) throw ValidationError.field('quantity', max > 0 ? `Only ${max} of ${product.name} available` : `${product.name} is out of stock`);
      line.quantity = quantity;
    }
    await this.repo.save(getTenantId(), cart);
    return this.present(cart);
  }

  async removeItem(token, itemId) {
    const cart = await this.loadOrCreate(token);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    await this.repo.save(getTenantId(), cart);
    return this.present(cart);
  }

  async applyCoupon(token, { code }) {
    const cart = await this.loadOrCreate(token);
    const coupon = await this.findCoupon(code);
    const { totals } = await this.price({ ...cart, coupon_code: null });
    const check = validateCoupon(coupon, totals.subtotal);
    if (!check.valid) throw ValidationError.field('code', coupon ? check.reason : 'Invalid coupon code');
    cart.coupon_code = coupon.code;
    await this.repo.save(getTenantId(), cart);
    return this.present(cart);
  }

  async removeCoupon(token) {
    const cart = await this.loadOrCreate(token);
    cart.coupon_code = null;
    await this.repo.save(getTenantId(), cart);
    return this.present(cart);
  }

  clear(token) {
    return this.repo.delete(getTenantId(), token);
  }
}
