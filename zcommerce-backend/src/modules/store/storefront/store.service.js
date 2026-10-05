import appConfig from '../../../app/config/app.config.js';

export class StorefrontService {
  constructor({ storefrontRepository, settingService }) {
    this.repo = storefrontRepository;
    this.settings = settingService;
  }

  settingsFor(tenant) {
    return this.settings.getStoreSettings(tenant);
  }

  sitemap() {
    return this.repo.sitemap();
  }

  /** Which store a host belongs to (the storefront calls this to route or show "store not found"). */
  async resolve(tenant) {
    const settings = await this.settings.getStoreSettings(tenant);
    return { tenant: { name: tenant.name, slug: tenant.slug, status: tenant.status }, store_url: settings.store_url };
  }

  /** Public platform details shown on unknown hosts. */
  async platform() {
    const { name, tagline, adminUrl, supportEmail } = appConfig.platform;
    return { name, tagline, admin_url: adminUrl, support_email: supportEmail, plans: await this.repo.activePlans() };
  }
}
