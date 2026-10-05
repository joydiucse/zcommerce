import { Router } from 'express';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { addItemSchema, updateItemSchema, itemParams, couponSchema } from './cart.validation.js';

export default function cartRoutes({ cartController: c }) {
  const r = Router();
  r.post('/', c.create);
  r.get('/', c.show);
  r.post('/items', validate(addItemSchema), c.addItem);
  r.patch('/items/:item_id', validate(updateItemSchema), c.updateItem);
  r.delete('/items/:item_id', validate(itemParams), c.removeItem);
  r.post('/coupon', validate(couponSchema), c.applyCoupon);
  r.delete('/coupon', c.removeCoupon);
  return r;
}
