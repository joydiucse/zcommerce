import { z, listQuery, idParams, money, nullableMoney, boolish } from '../../../shared/validators/index.js';

const type = z.enum(['flat', 'free', 'free_over']);

const fields = {
  name: z.string().trim().min(1).max(150),
  description: z.string().max(1000).nullable().optional(),
  type: type.default('flat'),
  rate: money.default(0),
  free_over_amount: nullableMoney,
  estimated_days: z.string().max(100).nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
};

const freeOverRule = (b) => b.type !== 'free_over' || (b.free_over_amount !== null && b.free_over_amount !== undefined);
const freeOverMsg = { message: 'free_over_amount is required for free_over methods', path: ['free_over_amount'] };

export const listShippingSchema = { query: listQuery.extend({ is_active: boolish.optional(), type: type.optional() }) };
export const createShippingSchema = { body: z.object(fields).refine(freeOverRule, freeOverMsg) };
export const updateShippingSchema = { params: idParams, body: z.object(fields).partial().refine(freeOverRule, freeOverMsg) };
export { idParams };
