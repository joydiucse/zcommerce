import { Router } from 'express';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { customerAuth } from '../../../app/middleware/store.middleware.js';
import { rateLimit } from '../../../app/middleware/rate-limit.middleware.js';
import { shippingMethodsSchema, checkoutSchema } from './checkout.validation.js';

const checkoutLimiter = rateLimit({ bucket: 'checkout', windowSec: 60, max: 20 });

export default function checkoutRoutes({ checkoutController: c }) {
  const r = Router();
  r.get('/shipping-methods', validate(shippingMethodsSchema), c.shippingMethods);
  r.post('/', checkoutLimiter, customerAuth({ optional: true }), validate(checkoutSchema), c.place);
  return r;
}
