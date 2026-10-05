import { NotFoundError } from '../../../shared/exceptions/index.js';

export class StoreBrandService {
  constructor({ storeBrandRepository }) {
    this.repo = storeBrandRepository;
  }

  list() {
    return this.repo.all();
  }

  async get(slug) {
    const brand = await this.repo.findBySlug(slug);
    if (!brand) throw new NotFoundError('Brand not found');
    return brand;
  }
}
