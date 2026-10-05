import { round2 } from '../utils/index.js';

/**
 * Check whether a coupon can be applied to a subtotal. Returns { valid, reason }.
 * Pure function: pass `now` for deterministic tests.
 */
export function validateCoupon(coupon, subtotal, now = new Date()) {
  if (!coupon) return { valid: false, reason: 'Coupon not found' };
  if (!coupon.is_active) return { valid: false, reason: 'This coupon is not active' };
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return { valid: false, reason: 'This coupon is not active yet' };
  if (coupon.ends_at && new Date(coupon.ends_at) < now) return { valid: false, reason: 'This coupon has expired' };
  if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, reason: 'This coupon has reached its usage limit' };
  }
  if (coupon.min_order_amount && subtotal < Number(coupon.min_order_amount)) {
    return { valid: false, reason: `A minimum order of ${Number(coupon.min_order_amount).toFixed(2)} is required for this coupon` };
  }
  return { valid: true, reason: null };
}

/** Shipping cost for a method given the (pre-discount) subtotal. */
export function shippingCost(method, subtotal) {
  if (!method) return 0;
  const rate = Number(method.rate) || 0;
  switch (method.type) {
    case 'free':
      return 0;
    case 'free_over':
      return method.free_over_amount !== null && method.free_over_amount !== undefined && subtotal >= Number(method.free_over_amount)
        ? 0
        : round2(rate);
    case 'flat':
    default:
      return round2(rate);
  }
}

/**
 * Single source of truth for cart and checkout totals.
 *
 * @param {object} p
 * @param {{price:number, quantity:number}[]} p.items
 * @param {object|null} [p.coupon]   valid coupon (type percent|fixed|free_shipping, value, max_discount)
 * @param {object|null} [p.shippingMethod] (type flat|free|free_over, rate, free_over_amount)
 * @param {{tax_rate?:number, tax_inclusive?:boolean}} [p.checkout]
 */
export function calculateTotals({ items = [], coupon = null, shippingMethod = null, checkout = {} } = {}) {
  const subtotal = round2(items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0));
  const itemCount = items.reduce((sum, i) => sum + Number(i.quantity), 0);

  let discount = 0;
  let freeShipping = false;
  if (coupon) {
    const value = Number(coupon.value) || 0;
    if (coupon.type === 'percent') {
      discount = (subtotal * value) / 100;
      if (coupon.max_discount !== null && coupon.max_discount !== undefined && Number(coupon.max_discount) > 0) {
        discount = Math.min(discount, Number(coupon.max_discount));
      }
    } else if (coupon.type === 'fixed') {
      discount = value;
    } else if (coupon.type === 'free_shipping') {
      freeShipping = true;
    }
  }
  discount = round2(Math.min(Math.max(discount, 0), subtotal));

  const shipping = freeShipping ? 0 : shippingCost(shippingMethod, subtotal);
  const taxable = round2(subtotal - discount);
  const rate = Number(checkout.tax_rate) || 0;

  let tax = 0;
  let grand;
  if (checkout.tax_inclusive) {
    // Prices already include tax: report the embedded tax, do not add it.
    tax = rate > 0 ? round2(taxable - taxable / (1 + rate / 100)) : 0;
    grand = round2(taxable + shipping);
  } else {
    tax = round2((taxable * rate) / 100);
    grand = round2(taxable + shipping + tax);
  }

  return {
    item_count: itemCount,
    subtotal,
    discount_total: discount,
    shipping_total: shipping,
    tax_total: tax,
    grand_total: grand,
    free_shipping: freeShipping,
  };
}
