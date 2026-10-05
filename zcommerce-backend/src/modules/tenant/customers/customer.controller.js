import { CrudController } from '../../../shared/helpers/crud.js';

export class CustomerController extends CrudController {
  constructor({ customerService }) {
    super(customerService);
  }
}
