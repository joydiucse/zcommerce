import { z, listQuery } from '../../../shared/validators/index.js';
import { PaymentStatus, PaymentMethod } from '../../../shared/enums/index.js';

export const listPaymentsSchema = {
  query: listQuery.extend({
    status: z.enum(PaymentStatus).optional(),
    method: z.enum(PaymentMethod).optional(),
    from: z.string().max(40).optional(),
    to: z.string().max(40).optional(),
  }),
};
