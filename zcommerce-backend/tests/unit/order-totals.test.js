import { describe, it, expect } from 'vitest';
import { calculateTotals, validateCoupon, shippingCost } from '../../src/shared/helpers/order-totals.js';

const items = [
  { price: 19.99, quantity: 2 },
  { price: 10, quantity: 1 },
]; // subtotal 49.98

describe('calculateTotals', () => {
  it('sums the subtotal and item count', () => {
    const t = calculateTotals({ items });
    expect(t.subtotal).toBe(49.98);
    expect(t.item_count).toBe(3);
    expect(t.grand_total).toBe(49.98);
  });

  it('applies a percent coupon capped by max_discount', () => {
    expect(calculateTotals({ items, coupon: { type: 'percent', value: 10 } }).discount_total).toBe(5);
    expect(calculateTotals({ items, coupon: { type: 'percent', value: 50, max_discount: 10 } }).discount_total).toBe(10);
  });

  it('never discounts more than the subtotal with a fixed coupon', () => {
    const t = calculateTotals({ items, coupon: { type: 'fixed', value: 500 } });
    expect(t.discount_total).toBe(49.98);
    expect(t.grand_total).toBe(0);
  });

  it('free_shipping coupon zeroes shipping', () => {
    const t = calculateTotals({ items, coupon: { type: 'free_shipping', value: 0 }, shippingMethod: { type: 'flat', rate: 9.5 } });
    expect(t.shipping_total).toBe(0);
    expect(t.discount_total).toBe(0);
  });

  it('computes shipping by method type', () => {
    expect(shippingCost({ type: 'flat', rate: 5.99 }, 10)).toBe(5.99);
    expect(shippingCost({ type: 'free', rate: 5 }, 10)).toBe(0);
    expect(shippingCost({ type: 'free_over', rate: 5.99, free_over_amount: 50 }, 49.98)).toBe(5.99);
    expect(shippingCost({ type: 'free_over', rate: 5.99, free_over_amount: 50 }, 50)).toBe(0);
  });

  it('adds exclusive tax on the discounted subtotal', () => {
    const t = calculateTotals({
      items: [{ price: 100, quantity: 1 }],
      coupon: { type: 'fixed', value: 20 },
      shippingMethod: { type: 'flat', rate: 10 },
      checkout: { tax_rate: 10 },
    });
    expect(t.tax_total).toBe(8);
    expect(t.grand_total).toBe(98); // 80 + 10 shipping + 8 tax
  });

  it('reports inclusive tax without adding it', () => {
    const t = calculateTotals({ items: [{ price: 110, quantity: 1 }], checkout: { tax_rate: 10, tax_inclusive: true } });
    expect(t.tax_total).toBe(10);
    expect(t.grand_total).toBe(110);
  });
});

describe('validateCoupon', () => {
  const now = new Date('2026-06-01T00:00:00Z');
  const base = { is_active: true, used_count: 0, usage_limit: null, min_order_amount: null, starts_at: null, ends_at: null };

  it('accepts a valid coupon', () => expect(validateCoupon(base, 10, now).valid).toBe(true));

  it('rejects inactive, expired, not-started, exhausted and below-minimum coupons', () => {
    expect(validateCoupon({ ...base, is_active: false }, 10, now).valid).toBe(false);
    expect(validateCoupon({ ...base, ends_at: '2026-05-01' }, 10, now).valid).toBe(false);
    expect(validateCoupon({ ...base, starts_at: '2026-07-01' }, 10, now).valid).toBe(false);
    expect(validateCoupon({ ...base, usage_limit: 5, used_count: 5 }, 10, now).valid).toBe(false);
    expect(validateCoupon({ ...base, min_order_amount: 25 }, 10, now).valid).toBe(false);
    expect(validateCoupon(null, 10, now).valid).toBe(false);
  });
});
