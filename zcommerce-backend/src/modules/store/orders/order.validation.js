import { z, listQuery } from '../../../shared/validators/index.js';

export const listStoreOrdersSchema = { query: listQuery };
export const showStoreOrderSchema = {
  params: z.object({ order_number: z.string().regex(/^\d{1,20}$/, 'Invalid order number') }),
  query: z.object({ email: z.string().trim().email().optional() }).passthrough(),
};
