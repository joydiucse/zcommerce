import { GlobalRepository } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class PlanRepository extends GlobalRepository {
  constructor() {
    super({ table: 'plans', jsonColumns: ['limits', 'features'] });
  }

  base() {
    return this.query().select('plans.*', db.raw('(select count(*) from tenants t where t.plan_id = plans.id)::int as tenants_count'));
  }

  async list(query = {}) {
    const qb = this.base();
    if (query.is_active !== undefined) qb.where('plans.is_active', query.is_active === true || query.is_active === 'true');
    if (query.all === 'true') {
      const data = await qb.orderBy('sort_order').orderBy('price_monthly');
      return { data, meta: { page: 1, limit: data.length || 1, total: data.length, total_pages: 1 } };
    }
    return paginateQuery(qb, query, {
      sortable: { sort_order: 'plans.sort_order', name: 'plans.name', price_monthly: 'plans.price_monthly', created_at: 'plans.created_at' },
      defaultSort: 'sort_order',
      defaultOrder: 'asc',
      searchColumns: ['plans.name', 'plans.slug'],
    });
  }

  findById(id) {
    return this.base().where('plans.id', id).first();
  }

  defaultPlan(trx = null) {
    return (trx || db)('plans').where({ is_active: true }).orderBy('sort_order').orderBy('price_monthly').first();
  }
}
