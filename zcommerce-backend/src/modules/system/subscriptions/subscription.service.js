import { db } from '../../../app/database/connection.js';
import { withTransaction } from '../../../app/database/transaction.js';
import { invalidateTenantCache } from '../../../app/tenant/tenant-resolver.js';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/index.js';

const addPeriod = (start, cycle) => {
  const d = new Date(start);
  if (cycle === 'yearly') d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
};

export class SubscriptionService {
  constructor({ subscriptionRepository, auditLogService }) {
    this.repo = subscriptionRepository;
    this.audit = auditLogService;
  }

  present(row) {
    const { tenant_name, tenant_slug, plan_name, ...s } = row;
    return { ...s, tenant: { id: s.tenant_id, name: tenant_name, slug: tenant_slug }, plan: { id: s.plan_id, name: plan_name } };
  }

  async list(query) {
    const { data, meta } = await this.repo.list(query);
    return { data: data.map((r) => this.present(r)), meta };
  }

  async get(id) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Subscription not found');
    return this.present(row);
  }

  async syncTenantPlan(trx, tenantId, planId, status) {
    await trx('tenants').where({ id: tenantId }).update({ plan_id: planId, updated_at: db.fn.now() });
    // A paid (active) subscription converts a trial tenant to active; suspended tenants stay suspended.
    if (status === 'active') await trx('tenants').where({ id: tenantId, status: 'trial' }).update({ status: 'active' });
  }

  async create(data, req) {
    const plan = await db('plans').where({ id: data.plan_id }).first();
    if (!plan) throw ValidationError.field('plan_id', 'Plan not found');
    const tenant = await db('tenants').where({ id: data.tenant_id }).first();
    if (!tenant) throw ValidationError.field('tenant_id', 'Tenant not found');
    const cycle = data.billing_cycle || 'monthly';
    const start = data.current_period_start ? new Date(data.current_period_start) : new Date();
    const row = await withTransaction(async (trx) => {
      // Only one live subscription per tenant: cancel any previous active/trialing one.
      await trx('subscriptions')
        .where({ tenant_id: tenant.id })
        .whereIn('status', ['trialing', 'active', 'past_due'])
        .update({ status: 'canceled', canceled_at: db.fn.now(), updated_at: db.fn.now() });
      const created = await this.repo.create(
        {
          tenant_id: tenant.id,
          plan_id: plan.id,
          status: data.status || 'active',
          billing_cycle: cycle,
          amount: data.amount ?? (cycle === 'yearly' ? plan.price_yearly : plan.price_monthly),
          current_period_start: start,
          current_period_end: data.current_period_end ? new Date(data.current_period_end) : addPeriod(start, cycle),
        },
        trx,
      );
      await this.syncTenantPlan(trx, tenant.id, plan.id, created.status);
      return created;
    });
    await invalidateTenantCache(tenant);
    await this.audit.record(req, {
      action: 'subscription.created',
      entity_type: 'subscription',
      entity_id: row.id,
      tenant_id: tenant.id,
      changes: { plan_id: plan.id, billing_cycle: cycle, amount: row.amount, previous_plan_id: tenant.plan_id },
    });
    return this.get(row.id);
  }

  async update(id, data, req) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Subscription not found');
    if (data.plan_id && data.plan_id !== existing.plan_id) {
      const plan = await db('plans').where({ id: data.plan_id }).first();
      if (!plan) throw ValidationError.field('plan_id', 'Plan not found');
      if (data.amount === undefined) data.amount = (data.billing_cycle || existing.billing_cycle) === 'yearly' ? plan.price_yearly : plan.price_monthly;
    }
    if (data.status === 'canceled' && !existing.canceled_at) data.canceled_at = new Date();
    await withTransaction(async (trx) => {
      await this.repo.update(id, data, trx);
      if (data.plan_id) await this.syncTenantPlan(trx, existing.tenant_id, data.plan_id, data.status || existing.status);
    });
    const tenant = await db('tenants').where({ id: existing.tenant_id }).first();
    await invalidateTenantCache(tenant);
    await this.audit.record(req, {
      action: data.plan_id && data.plan_id !== existing.plan_id ? 'subscription.plan_changed' : 'subscription.updated',
      entity_type: 'subscription',
      entity_id: id,
      tenant_id: existing.tenant_id,
      changes: { ...data, previous_plan_id: existing.plan_id },
    });
    return this.get(id);
  }

  async cancel(id, req) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Subscription not found');
    await this.repo.update(id, { status: 'canceled', canceled_at: new Date() });
    await this.audit.record(req, { action: 'subscription.canceled', entity_type: 'subscription', entity_id: id, tenant_id: existing.tenant_id });
    return this.get(id);
  }
}
