/**
 * Store URL per tenant. `site_url` is the public storefront URL (e.g. https://shop.example.com,
 * http://localhost:3002); `site_host` is its normalised host[:port], indexed for request routing.
 */
export async function up(knex) {
  await knex.schema.alterTable('tenants', (t) => {
    t.string('site_url', 500);
    t.string('site_host', 255).unique();
  });
  // custom_domain is now matched exactly as host[:port]; normalise existing values.
  await knex.raw("update tenants set custom_domain = lower(trim(trailing '.' from custom_domain)) where custom_domain is not null");
}

export async function down(knex) {
  await knex.schema.alterTable('tenants', (t) => {
    t.dropColumn('site_host');
    t.dropColumn('site_url');
  });
}
