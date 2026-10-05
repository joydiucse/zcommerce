import { db } from '../database/connection.js';
import redisConfig from '../config/redis.config.js';
import appConfig from '../config/app.config.js';
import { cache } from '../../shared/utils/cache.js';
import { normalizeHost } from '../../shared/utils/index.js';
import { tenantColumns } from './tenant-resolver.js';

/**
 * Resolve a tenant from the storefront host: exact host[:port] match against `tenants.site_host`
 * (the normalised host of the tenant's `site_url`). Hits are cached at `tenant:domain:<host>`.
 */
export async function resolveTenantByDomain(rawHost) {
  const host = normalizeHost(rawHost);
  if (!host) return null;
  return cache.remember(redisConfig.keys.tenantDomain(host), appConfig.cacheTtl.tenant, () =>
    db('tenants').select(tenantColumns).where('site_host', host).first(),
  );
}
