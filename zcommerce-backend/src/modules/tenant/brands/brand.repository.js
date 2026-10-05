import { TenantRepository } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class BrandRepository extends TenantRepository {
  constructor() {
    super({ table: 'brands' });
  }

  base() {
    return this.query().select('brands.*', db.raw('(select count(*) from products p where p.brand_id = brands.id)::int as products_count'));
  }

  async list(query = {}) {
    const qb = this.base();
    if (query.is_active !== undefined) qb.where('brands.is_active', query.is_active === true || query.is_active === 'true');
    return paginateQuery(qb, query, {
      sortable: { created_at: 'brands.created_at', name: 'brands.name', products_count: 'products_count' },
      searchColumns: ['brands.name', 'brands.slug'],
    });
  }

  all() {
    return this.base().orderBy('brands.name');
  }

  findById(id) {
    return this.base().where('brands.id', id).first();
  }
}
