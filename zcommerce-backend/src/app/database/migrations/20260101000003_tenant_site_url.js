/**
 * Store URL per tenant, replacing custom_domain. `site_url` is the public storefront URL
 * (e.g. https://shop.example.com, http://localhost:3002); `site_host` is its normalised
 * host[:port], unique and indexed, which the store API matches against the request host.
 */
export async function up(knex) {
  await knex.schema.alterTable('tenants', (t) => {
    t.string('site_url', 500);
    t.string('site_host', 255).unique();
  });
  await knex.raw(`
    update tenants
       set site_url = 'https://' || lower(custom_domain), site_host = lower(custom_domain)
     where custom_domain is not null and custom_domain <> 'localhost'`);
  await knex.schema.alterTable('tenants', (t) => {
    t.dropColumn('custom_domain');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('tenants', (t) => {
    t.string('custom_domain', 255).unique();
  });
  await knex.raw('update tenants set custom_domain = site_host where site_host is not null');
  await knex.schema.alterTable('tenants', (t) => {
    t.dropColumn('site_host');
    t.dropColumn('site_url');
  });
}
