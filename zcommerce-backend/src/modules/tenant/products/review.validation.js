import { z, listQuery, idParams, uuid } from '../../../shared/validators/index.js';

const status = z.enum(['pending', 'approved', 'rejected']);

export const listReviewsSchema = {
  query: listQuery.extend({ status: status.optional(), product_id: uuid.optional(), rating: z.coerce.number().int().min(1).max(5).optional() }),
};
export const updateReviewSchema = { params: idParams, body: z.object({ status }) };
export { idParams };
