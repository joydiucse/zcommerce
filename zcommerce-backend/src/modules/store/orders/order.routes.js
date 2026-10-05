import { Router } from 'express';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { customerAuth } from '../../../app/middleware/store.middleware.js';
import { listStoreOrdersSchema, showStoreOrderSchema } from './order.validation.js';

export default function storeOrderRoutes({ storeOrderController: c }) {
  const r = Router();
  r.get('/', customerAuth(), validate(listStoreOrdersSchema), c.list);
  r.get('/:order_number', customerAuth({ optional: true }), validate(showStoreOrderSchema), c.show);
  return r;
}
