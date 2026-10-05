import { CrudService } from '../../../shared/helpers/crud.js';

export class BrandService extends CrudService {
  constructor({ brandRepository }) {
    super(brandRepository, { entity: 'Brand', slugFrom: 'name' });
  }

  all() {
    return this.repo.all();
  }
}
