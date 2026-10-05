import { SETTINGS_DEFAULTS, SETTINGS_GROUPS } from '../../../shared/constants/index.js';
import { deepMerge } from '../../../shared/utils/index.js';
import { cache } from '../../../shared/utils/cache.js';
import redisConfig from '../../../app/config/redis.config.js';
import appConfig from '../../../app/config/app.config.js';
import { NotFoundError } from '../../../shared/exceptions/index.js';

export class SettingService {
  constructor({ settingRepository }) {
    this.repo = settingRepository;
  }

  /** All groups, defaults deep-merged with stored values. */
  async getAll(tenantId) {
    const stored = await this.repo.getAll(tenantId);
    return Object.fromEntries(SETTINGS_GROUPS.map((g) => [g, deepMerge(SETTINGS_DEFAULTS[g], stored[g] || {})]));
  }

  async getGroup(tenantId, group) {
    if (!SETTINGS_GROUPS.includes(group)) throw new NotFoundError(`Unknown settings group "${group}"`);
    return (await this.getAll(tenantId))[group];
  }

  /** Replace a group (body already validated); merged over current values so omitted keys are kept. */
  async update(tenantId, group, value) {
    const current = await this.getGroup(tenantId, group);
    const next = deepMerge(current, value);
    const saved = await this.repo.upsert(tenantId, group, next);
    await cache.del(redisConfig.keys.settings(tenantId));
    return deepMerge(SETTINGS_DEFAULTS[group], saved);
  }

  /** Public storefront URL; null when the tenant has none (the storefront then uses the request host). */
  storeUrl(tenant, settings) {
    if (settings.seo?.canonical_url) return settings.seo.canonical_url.replace(/\/+$/, '');
    if (tenant.site_url) return tenant.site_url.replace(/\/+$/, '');
    return null;
  }

  /** Public storefront settings (no `notifications`), cached at `settings:<tenant_id>`. */
  async getStoreSettings(tenant) {
    return cache.remember(redisConfig.keys.settings(tenant.id), appConfig.cacheTtl.settings, async () => {
      const { notifications, ...publicSettings } = await this.getAll(tenant.id);
      return {
        ...publicSettings,
        tenant: { name: tenant.name, slug: tenant.slug },
        store_url: this.storeUrl(tenant, publicSettings),
      };
    });
  }
}
