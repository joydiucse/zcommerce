import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listOrdersSchema, updateStatusSchema, updatePaymentStatusSchema, idParams } from './order.validation.js';

export default function orderRoutes({ orderController: c }) {
  const r = Router();
  r.get('/', can('orders.view'), validate(listOrdersSchema), c.list);
  r.get('/:id', can('orders.view'), validate({ params: idParams }), c.show);
  r.put('/:id/status', can('orders.update'), validate(updateStatusSchema), c.updateStatus);
  r.put('/:id/payment-status', can('payments.update', 'orders.update'), validate(updatePaymentStatusSchema), c.updatePaymentStatus);
  return r;
}
