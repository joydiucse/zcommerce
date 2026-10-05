import { CrudService } from '../../../shared/helpers/crud.js';

export class ShippingMethodService extends CrudService {
  constructor({ shippingMethodRepository }) {
    super(shippingMethodRepository, { entity: 'Shipping method' });
  }

  async prepare(data) {
    if (data.type === 'free') data.rate = 0;
    if (data.type && data.type !== 'free_over') data.free_over_amount = null;
    return data;
  }
}
