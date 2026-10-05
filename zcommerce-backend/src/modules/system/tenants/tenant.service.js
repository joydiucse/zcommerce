import { withTransaction } from '../../../app/database/transaction.js';
import { db } from '../../../app/database/connection.js';
import { hashPassword } from '../../../app/security/password.js';
import { invalidateTenantCache } from '../../../app/tenant/tenant-resolver.js';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/index.js';
import { DEFAULT_TENANT_ROLES, defaultSettingsFor } from '../../../shared/constants/index.js';
import { cache } from '../../../shared/utils/cache.js';
import redisConfig from '../../../app/config/redis.config.js';
import { round2, siteHostOf } from '../../../shared/utils/index.js';

const TRIAL_DAYS = 14;

export class TenantService {
  constructor({ tenantRepository, planRepository, auditLogService }) {
    this.repo = tenantRepository;
    this.plans = planRepository;
    this.audit = auditLogService;
  }

  present(row) {
    if (!row) return row;
    const { plan_name, plan_slug, owner_name, owner_email, ...t } = row;
    return {
      ...t,
      plan: t.plan_id ? { id: t.plan_id, name: plan_name, slug: plan_slug } : null,
      owner: t.owner_id ? { id: t.owner_id, name: owner_name, email: owner_email } : null,
    };
  }

  async list(query) {
    const { data, meta } = await this.repo.list(query);
    return { data: data.map((r) => this.present(r)), meta };
  }

  async get(id) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Tenant not found');
    const [subscription, stats] = await Promise.all([this.repo.latestSubscription(id), this.repo.stats(id)]);
    return { ...this.present(row), subscription: subscription || null, stats };
  }

  /**
   * Provision a tenant: tenant row, default Owner/Manager/Staff roles, owner user,
   * default settings and a trial subscription — all in one transaction.
   */
  /** A store host may belong to one tenant only, whether set as custom_domain or via site_url. */
  async assertHostsAvailable({ custom_domain, site_url }, exceptId = null) {
    const checks = [['custom_domain', custom_domain || null], ['site_url', siteHostOf(site_url)]];
    for (const [field, host] of checks) {
      if (!host) continue;
      const q = db('tenants').where((w) => w.whereRaw('lower(custom_domain) = ?', [host]).orWhere('site_host', host));
      if (exceptId) q.whereNot('id', exceptId);
      if (await q.first('id')) throw ValidationError.field(field, `${host} is already used by another store`);
    }
  }

  async create(data, req) {
    const { owner, ...tenantData } = data;
    await this.assertHostsAvailable(tenantData);
    const tenant = await withTransaction(async (trx) => {
      const plan = tenantData.plan_id ? await trx('plans').where({ id: tenantData.plan_id }).first() : await this.plans.defaultPlan(trx);
      if (tenantData.plan_id && !plan) throw ValidationError.field('plan_id', 'Plan not found');
      const trialEnds = new Date(Date.now() + TRIAL_DAYS * 86400000);

      const [t] = await trx('tenants')
        .insert({
          name: tenantData.name,
          slug: tenantData.slug,
          email: tenantData.email,
          phone: tenantData.phone || null,
          custom_domain: tenantData.custom_domain || null,
          site_url: tenantData.site_url || null,
          site_host: siteHostOf(tenantData.site_url),
          plan_id: plan?.id || null,
          status: 'trial',
          trial_ends_at: trialEnds,
        })
        .returning('*');

      const roles = await trx('roles')
        .insert(DEFAULT_TENANT_ROLES.map((r) => ({ ...r, tenant_id: t.id, permissions: JSON.stringify(r.permissions) })))
        .returning('*');
      const ownerRole = roles.find((r) => r.name === 'Owner');

      const [user] = await trx('users')
        .insert({
          tenant_id: t.id,
          name: owner.name,
          email: owner.email,
          password_hash: await hashPassword(owner.password),
          role_id: ownerRole.id,
          status: 'active',
        })
        .returning('*');
      await trx('tenants').where({ id: t.id }).update({ owner_id: user.id });

      const settings = defaultSettingsFor(t.name, t.email);
      await trx('tenant_settings').insert(
        Object.entries(settings).map(([group, value]) => ({ tenant_id: t.id, group, value: JSON.stringify(value) })),
      );

      if (plan) {
        await trx('subscriptions').insert({
          tenant_id: t.id,
          plan_id: plan.id,
          status: 'trialing',
          billing_cycle: 'monthly',
          amount: plan.price_monthly,
          current_period_start: new Date(),
          current_period_end: trialEnds,
        });
      }
      return t;
    });

    await this.audit.record(req, {
      action: 'tenant.created',
      entity_type: 'tenant',
      entity_id: tenant.id,
      tenant_id: tenant.id,
      changes: { name: tenant.name, slug: tenant.slug, plan_id: tenant.plan_id, owner_email: owner.email },
    });
    return this.get(tenant.id);
  }

  async update(id, data, req) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Tenant not found');
    if (data.custom_domain === '') data.custom_domain = null;
    await this.assertHostsAvailable(data, id);
    if (data.site_url !== undefined) {
      data.site_url = data.site_url ? data.site_url.replace(//+$/, '') : null;
      data.site_host = siteHostOf(data.site_url);
    }
    await this.repo.update(id, data);
    await invalidateTenantCache(existing);
    await cache.del(redisConfig.keys.settings(id));
    if (data.plan_id && data.plan_id !== existing.plan_id) {
      await this.audit.record(req, {
        action: 'tenant.plan_changed',
        entity_type: 'tenant',
        entity_id: id,
        tenant_id: id,
        changes: { from: existing.plan_id, to: data.plan_id },
      });
    }
    await this.audit.record(req, { action: 'tenant.updated', entity_type: 'tenant', entity_id: id, tenant_id: id, changes: data });
    return this.get(id);
  }

  async setStatus(id, status, req) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Tenant not found');
    await this.repo.update(id, { status });
    await invalidateTenantCache(existing);
    await this.audit.record(req, {
      action: status === 'suspended' ? 'tenant.suspended' : 'tenant.activated',
      entity_type: 'tenant',
      entity_id: id,
      tenant_id: id,
      changes: { from: existing.status, to: status },
    });
    return this.get(id);
  }

  suspend(id, req) {
    return this.setStatus(id, 'suspended', req);
  }

  activate(id, req) {
    return this.setStatus(id, 'active', req);
  }

  async remove(id, req) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Tenant not found');
    await withTransaction(async (trx) => {
      await trx('tenants').where({ id }).update({ owner_id: null });
      await trx('tenants').where({ id }).del();
    });
    await invalidateTenantCache(existing);
    await this.audit.record(req, { action: 'tenant.deleted', entity_type: 'tenant', entity_id: id, changes: { name: existing.name, slug: existing.slug } });
    return { id };
  }

  async dashboard() {
    const d = await this.repo.dashboard();
    return {
      tenants_total: d.counts.total,
      tenants_active: d.counts.active,
      tenants_trial: d.counts.trial,
      tenants_suspended: d.counts.total - d.counts.active - d.counts.trial,
      mrr: round2(d.mrr),
      invoices_open_amount: round2(d.openInvoices),
      recent_tenants: d.recent.map((r) => this.present(r)),
      tenants_by_month: d.byMonth.map((m) => ({ month: m.month, count: Number(m.count) })),
      plans: await db('plans')
        .leftJoin('tenants', 'tenants.plan_id', 'plans.id')
        .groupBy('plans.id', 'plans.name')
        .select('plans.id', 'plans.name', db.raw('count(tenants.id)::int as tenants'))
        .orderBy('plans.sort_order'),
    };
  }
}
