import { CrudService } from '../../../shared/helpers/crud.js';

export class CouponService extends CrudService {
  constructor({ couponRepository }) {
    super(couponRepository, { entity: 'Coupon' });
  }

  async prepare(data) {
    if (data.code) data.code = data.code.trim().toUpperCase();
    if (data.type === 'free_shipping') data.value = 0;
    return data;
  }
}
