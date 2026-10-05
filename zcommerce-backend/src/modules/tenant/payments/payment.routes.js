import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listPaymentsSchema } from './payment.validation.js';

export default function paymentRoutes({ paymentController: c }) {
  const r = Router();
  r.get('/', can('payments.view'), validate(listPaymentsSchema), c.list);
  return r;
}
