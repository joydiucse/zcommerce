import { CrudController } from '../../../shared/helpers/crud.js';

export class ShippingMethodController extends CrudController {
  constructor({ shippingMethodService }) {
    super(shippingMethodService);
  }
}
