import { z, listQuery, idParams, email, password, address, boolish } from '../../../shared/validators/index.js';

const body = z.object({
  name: z.string().trim().min(1).max(150),
  email,
  phone: z.string().trim().max(50).nullable().optional(),
  password: password.optional(),
  status: z.enum(['active', 'disabled']).default('active'),
  accepts_marketing: z.boolean().default(false),
  addresses: z.array(address).max(20).default([]),
});

export const listCustomersSchema = {
  query: listQuery.extend({
    status: z.enum(['active', 'disabled']).optional(),
    accepts_marketing: boolish.optional(),
    has_account: boolish.optional(),
  }),
};
export const createCustomerSchema = { body };
export const updateCustomerSchema = { params: idParams, body: body.partial() };
export { idParams };
