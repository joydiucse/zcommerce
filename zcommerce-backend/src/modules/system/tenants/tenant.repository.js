import { GlobalRepository } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery } from '../../../shared/helpers/index.js';
import { NON_REVENUE_STATUSES } from '../../../shared/enums/index.js';

export class TenantRepository extends GlobalRepository {
  constructor() {
    super({ table: 'tenants' });
  }

  base() {
    return this.query()
      .leftJoin('plans', 'plans.id', 'tenants.plan_id')
      .leftJoin('users as owner', 'owner.id', 'tenants.owner_id')
      .select('tenants.*', 'plans.name as plan_name', 'plans.slug as plan_slug', 'owner.name as owner_name', 'owner.email as owner_email');
  }

  async list(query = {}) {
    const qb = this.base();
    if (query.status) qb.where('tenants.status', query.status);
    if (query.plan_id) qb.where('tenants.plan_id', query.plan_id);
    return paginateQuery(qb, query, {
      sortable: { created_at: 'tenants.created_at', name: 'tenants.name', slug: 'tenants.slug', status: 'tenants.status' },
      searchColumns: ['tenants.name', 'tenants.slug', 'tenants.email', 'tenants.custom_domain'],
    });
  }

  findById(id) {
    return this.base().where('tenants.id', id).first();
  }

  latestSubscription(tenantId) {
    return db('subscriptions')
      .leftJoin('plans', 'plans.id', 'subscriptions.plan_id')
      .select('subscriptions.*', 'plans.name as plan_name')
      .where('subscriptions.tenant_id', tenantId)
      .orderBy('subscriptions.created_at', 'desc')
      .first();
  }

  async stats(tenantId) {
    const [products, customers, orders] = await Promise.all([
      db('products').where({ tenant_id: tenantId }).count({ c: '*' }).first(),
      db('customers').where({ tenant_id: tenantId }).count({ c: '*' }).first(),
      db('orders')
        .where({ tenant_id: tenantId })
        .select(
          db.raw('count(*)::int as c'),
          db.raw(`coalesce(sum(grand_total) filter (where status not in (${NON_REVENUE_STATUSES.map(() => '?').join(',')})), 0) as revenue`, NON_REVENUE_STATUSES),
        )
        .first(),
    ]);
    return { products_count: products.c, customers_count: customers.c, orders_count: orders.c, revenue: orders.revenue };
  }

  // ----- dashboard -----
  async dashboard() {
    const [counts, mrr, openInvoices, recent, byMonth] = await Promise.all([
      db('tenants')
        .select(
          db.raw('count(*)::int as total'),
          db.raw(`count(*) filter (where status = 'active')::int as active`),
          db.raw(`count(*) filter (where status = 'trial')::int as trial`),
        )
        .first(),
      db('subscriptions')
        .where({ status: 'active' })
        .select(db.raw(`coalesce(sum(case when billing_cycle = 'yearly' then amount / 12 else amount end), 0) as mrr`))
        .first(),
      db('invoices').where({ status: 'open' }).select(db.raw('coalesce(sum(amount), 0) as amount')).first(),
      this.base().orderBy('tenants.created_at', 'desc').limit(5),
      db.raw(`
        select to_char(m, 'YYYY-MM') as month, coalesce(count(t.id), 0)::int as count
        from generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') m
        left join tenants t on date_trunc('month', t.created_at) = m
        group by m order by m`),
    ]);
    return { counts, mrr: mrr.mrr, openInvoices: openInvoices.amount, recent, byMonth: byMonth.rows };
  }
}
