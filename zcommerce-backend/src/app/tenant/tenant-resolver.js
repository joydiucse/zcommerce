import { db } from '../database/connection.js';
import redisConfig from '../config/redis.config.js';
import appConfig from '../config/app.config.js';
import { cache } from '../../shared/utils/cache.js';
import { normalizeHost } from '../../shared/utils/index.js';

const TENANT_COLUMNS = ['id', 'name', 'slug', 'custom_domain', 'site_url', 'site_host', 'email', 'phone', 'status', 'plan_id', 'trial_ends_at', 'owner_id'];

export const tenantColumns = TENANT_COLUMNS;

/** Resolve a tenant by slug (cached in Redis at `tenant:slug:<slug>`, memory fallback). */
export async function resolveTenantBySlug(slug) {
  if (!slug) return null;
  const s = String(slug).trim().toLowerCase();
  return cache.remember(redisConfig.keys.tenantSlug(s), appConfig.cacheTtl.tenant, () =>
    db('tenants').select(TENANT_COLUMNS).where({ slug: s }).first(),
  );
}

/** Resolve a tenant by id (used by tenant-scoped JWT requests). */
export async function resolveTenantById(id) {
  if (!id) return null;
  return cache.remember(redisConfig.keys.tenantId(id), appConfig.cacheTtl.tenant, () =>
    db('tenants').select(TENANT_COLUMNS).where({ id }).first(),
  );
}

/** Drop every cached lookup for a tenant (call after update/suspend/activate/delete). */
export async function invalidateTenantCache(tenant) {
  if (!tenant) return;
  const keys = [redisConfig.keys.tenantId(tenant.id), redisConfig.keys.tenantSlug(tenant.slug)];
  if (tenant.custom_domain) keys.push(redisConfig.keys.tenantDomain(normalizeHost(tenant.custom_domain)));
  if (tenant.site_host) keys.push(redisConfig.keys.tenantDomain(tenant.site_host));
  await cache.del(keys);
}
