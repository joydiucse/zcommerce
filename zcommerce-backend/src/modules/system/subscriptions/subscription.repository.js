import { GlobalRepository } from '../../../app/tenant/tenant-scope.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class SubscriptionRepository extends GlobalRepository {
  constructor() {
    super({ table: 'subscriptions' });
  }

  base() {
    return this.query()
      .leftJoin('tenants', 'tenants.id', 'subscriptions.tenant_id')
      .leftJoin('plans', 'plans.id', 'subscriptions.plan_id')
      .select('subscriptions.*', 'tenants.name as tenant_name', 'tenants.slug as tenant_slug', 'plans.name as plan_name');
  }

  async list(query = {}) {
    const qb = this.base();
    if (query.status) qb.where('subscriptions.status', query.status);
    if (query.tenant_id) qb.where('subscriptions.tenant_id', query.tenant_id);
    return paginateQuery(qb, query, {
      sortable: {
        created_at: 'subscriptions.created_at',
        amount: 'subscriptions.amount',
        current_period_end: 'subscriptions.current_period_end',
        status: 'subscriptions.status',
      },
      searchColumns: ['tenants.name', 'tenants.slug', 'plans.name'],
    });
  }

  findById(id) {
    return this.base().where('subscriptions.id', id).first();
  }
}
