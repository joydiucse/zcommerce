import { z, listQuery, idParams, uuid } from '../../../shared/validators/index.js';
import { OrderStatus, PaymentStatus, FulfillmentStatus } from '../../../shared/enums/index.js';

export const listOrdersSchema = {
  query: listQuery.extend({
    status: z.enum(OrderStatus).optional(),
    payment_status: z.enum(PaymentStatus).optional(),
    fulfillment_status: z.enum(FulfillmentStatus).optional(),
    customer_id: uuid.optional(),
    from: z.string().max(40).optional(),
    to: z.string().max(40).optional(),
  }),
};

export const updateStatusSchema = {
  params: idParams,
  body: z.object({
    status: z.enum(OrderStatus),
    note: z.string().max(1000).optional().nullable(),
    tracking_number: z.string().max(100).optional().nullable(),
  }),
};

export const updatePaymentStatusSchema = { params: idParams, body: z.object({ payment_status: z.enum(PaymentStatus) }) };
export { idParams };
