import { z, listQuery, idParams, uuid, money } from '../../../shared/validators/index.js';

const status = z.enum(['trialing', 'active', 'past_due', 'canceled']);
const cycle = z.enum(['monthly', 'yearly']);

export const listSubscriptionsSchema = { query: listQuery.extend({ status: status.optional(), tenant_id: uuid.optional() }) };

export const createSubscriptionSchema = {
  body: z.object({
    tenant_id: uuid,
    plan_id: uuid,
    status: status.default('active'),
    billing_cycle: cycle.default('monthly'),
    amount: money.optional(),
    current_period_start: z.coerce.date().optional(),
    current_period_end: z.coerce.date().optional(),
  }),
};

export const updateSubscriptionSchema = {
  params: idParams,
  body: z
    .object({
      plan_id: uuid,
      status,
      billing_cycle: cycle,
      amount: money,
      current_period_start: z.coerce.date().nullable(),
      current_period_end: z.coerce.date().nullable(),
    })
    .partial(),
};

export { idParams };
