import { z, listQuery, idParams, money, nullableMoney, boolish } from '../../../shared/validators/index.js';

const type = z.enum(['percent', 'fixed', 'free_shipping']);

const fields = {
  code: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, 'Code may only contain letters, numbers, dashes and underscores'),
  type,
  value: money.default(0),
  min_order_amount: nullableMoney,
  max_discount: nullableMoney,
  usage_limit: z.union([z.coerce.number().int().min(1), z.null()]).optional(),
  starts_at: z.coerce.date().nullable().optional(),
  ends_at: z.coerce.date().nullable().optional(),
  is_active: z.boolean().default(true),
};

const percentRule = (b) => b.type !== 'percent' || b.value === undefined || b.value <= 100;
const percentMsg = { message: 'Percent value cannot exceed 100', path: ['value'] };
const dateRule = (b) => !b.starts_at || !b.ends_at || b.ends_at > b.starts_at;
const dateMsg = { message: 'ends_at must be after starts_at', path: ['ends_at'] };

export const listCouponsSchema = { query: listQuery.extend({ is_active: boolish.optional(), type: type.optional() }) };
export const createCouponSchema = { body: z.object(fields).refine(percentRule, percentMsg).refine(dateRule, dateMsg) };
export const updateCouponSchema = {
  params: idParams,
  body: z.object(fields).partial().refine(percentRule, percentMsg).refine(dateRule, dateMsg),
};
export { idParams };
