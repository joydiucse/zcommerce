import { db } from '../database/connection.js';
import redisConfig from '../config/redis.config.js';
import appConfig from '../config/app.config.js';
import { cache } from '../../shared/utils/cache.js';
import { normalizeHost } from '../../shared/utils/index.js';
import { tenantColumns, resolveTenantBySlug } from './tenant-resolver.js';

/** `<slug>.<STORE_BASE_DOMAIN>` → slug (port ignored), else null. */
function subdomainSlug(host) {
  const base = appConfig.storeBaseDomain;
  if (!base) return null;
  const hostname = host.replace(/:\d+$/, '');
  if (!hostname.endsWith(`.${base}`)) return null;
  const label = hostname.slice(0, -(base.length + 1));
  return /^[a-z0-9-]+$/.test(label) ? label : null;
}

/**
 * Resolve a tenant from the storefront host. Exact host[:port] match against
 * `tenants.custom_domain` or `tenants.site_host` (host of `site_url`), then
 * `<slug>.<STORE_BASE_DOMAIN>` subdomains. Hits are cached at `tenant:domain:<host>`.
 */
export async function resolveTenantByDomain(rawHost) {
  const host = normalizeHost(rawHost);
  if (!host) return null;
  const tenant = await cache.remember(redisConfig.keys.tenantDomain(host), appConfig.cacheTtl.tenant, () =>
    db('tenants')
      .select(tenantColumns)
      .where((q) => q.whereRaw('lower(custom_domain) = ?', [host]).orWhere('site_host', host))
      .first(),
  );
  if (tenant) return tenant;
  const slug = subdomainSlug(host);
  return slug ? resolveTenantBySlug(slug) : null;
}
