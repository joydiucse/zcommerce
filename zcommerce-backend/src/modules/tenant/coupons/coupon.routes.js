import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listCouponsSchema, createCouponSchema, updateCouponSchema, idParams } from './coupon.validation.js';

export default function couponRoutes({ couponController: c }) {
  const r = Router();
  r.get('/', can('coupons.view'), validate(listCouponsSchema), c.list);
  r.post('/', can('coupons.create'), validate(createCouponSchema), c.create);
  r.get('/:id', can('coupons.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('coupons.update'), validate(updateCouponSchema), c.update);
  r.delete('/:id', can('coupons.delete'), validate({ params: idParams }), c.destroy);
  return r;
}
