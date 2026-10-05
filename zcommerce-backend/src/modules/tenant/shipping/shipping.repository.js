import { TenantRepository } from '../../../app/tenant/tenant-scope.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class ShippingMethodRepository extends TenantRepository {
  constructor() {
    super({ table: 'shipping_methods' });
  }

  async list(query = {}) {
    const qb = this.query().select('shipping_methods.*');
    if (query.is_active !== undefined) qb.where('shipping_methods.is_active', query.is_active === true || query.is_active === 'true');
    if (query.type) qb.where('shipping_methods.type', query.type);
    return paginateQuery(qb, query, {
      sortable: { sort_order: 'shipping_methods.sort_order', name: 'shipping_methods.name', rate: 'shipping_methods.rate', created_at: 'shipping_methods.created_at' },
      defaultSort: 'sort_order',
      defaultOrder: 'asc',
      searchColumns: ['shipping_methods.name'],
    });
  }

  active(trx = null) {
    return this.query(trx).where('shipping_methods.is_active', true).orderBy('sort_order').orderBy('rate');
  }
}
