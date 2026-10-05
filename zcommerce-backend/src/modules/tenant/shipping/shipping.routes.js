import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listShippingSchema, createShippingSchema, updateShippingSchema, idParams } from './shipping.validation.js';

/** Mounted at /tenant/shipping -> /tenant/shipping/methods */
export default function shippingRoutes({ shippingMethodController: c }) {
  const r = Router();
  r.get('/methods', can('shipping.view'), validate(listShippingSchema), c.list);
  r.post('/methods', can('shipping.create'), validate(createShippingSchema), c.create);
  r.get('/methods/:id', can('shipping.view'), validate({ params: idParams }), c.show);
  r.put('/methods/:id', can('shipping.update'), validate(updateShippingSchema), c.update);
  r.delete('/methods/:id', can('shipping.delete'), validate({ params: idParams }), c.destroy);
  return r;
}
