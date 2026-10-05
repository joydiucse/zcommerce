import { CrudController } from '../../../shared/helpers/crud.js';

export class CouponController extends CrudController {
  constructor({ couponService }) {
    super(couponService);
  }
}
