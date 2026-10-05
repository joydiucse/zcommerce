/** Tenant-owned tables. Every table: tenant_id (cascade) + index, uuid pk, timestamps. */
const tenantCol = (knex, t) => {
  t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
  t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.index(['tenant_id']);
};

export async function up(knex) {
  await knex.schema.createTable('roles', (t) => {
    tenantCol(knex, t);
    t.string('name', 100).notNullable();
    t.text('description');
    t.jsonb('permissions').notNullable().defaultTo('[]');
    t.boolean('is_system').notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.unique(['tenant_id', 'name']);
  });

  await knex.schema.createTable('users', (t) => {
    tenantCol(knex, t);
    t.string('name', 150).notNullable();
    t.string('email', 255).notNullable();
    t.string('password_hash', 255).notNullable();
    t.uuid('role_id').references('id').inTable('roles').onDelete('RESTRICT');
    t.string('status', 20).notNullable().defaultTo('active');
    t.string('avatar_url', 2048);
    t.timestamp('last_login_at');
    t.timestamps(true, true);
    t.unique(['tenant_id', 'email']);
  });

  await knex.schema.alterTable('tenants', (t) => {
    t.foreign('owner_id').references('id').inTable('users').onDelete('SET NULL');
  });

  await knex.schema.createTable('categories', (t) => {
    tenantCol(knex, t);
    t.uuid('parent_id').references('id').inTable('categories').onDelete('SET NULL');
    t.string('name', 150).notNullable();
    t.string('slug', 180).notNullable();
    t.text('description');
    t.string('image_url', 2048);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.string('meta_title', 255);
    t.text('meta_description');
    t.timestamps(true, true);
    t.unique(['tenant_id', 'slug']);
    t.index(['parent_id']);
  });

  await knex.schema.createTable('brands', (t) => {
    tenantCol(knex, t);
    t.string('name', 150).notNullable();
    t.string('slug', 180).notNullable();
    t.text('description');
    t.string('logo_url', 2048);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.string('meta_title', 255);
    t.text('meta_description');
    t.timestamps(true, true);
    t.unique(['tenant_id', 'slug']);
  });

  await knex.schema.createTable('products', (t) => {
    tenantCol(knex, t);
    t.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    t.uuid('brand_id').references('id').inTable('brands').onDelete('SET NULL');
    t.string('name', 255).notNullable();
    t.string('slug', 180).notNullable();
    t.string('sku', 100);
    t.text('short_description');
    t.text('description');
    t.decimal('price', 12, 2).notNullable().defaultTo(0);
    t.decimal('compare_at_price', 12, 2);
    t.decimal('cost_price', 12, 2);
    t.string('status', 20).notNullable().defaultTo('draft');
    t.boolean('is_featured').notNullable().defaultTo(false);
    t.boolean('track_inventory').notNullable().defaultTo(true);
    t.integer('stock_quantity').notNullable().defaultTo(0);
    t.integer('low_stock_threshold').notNullable().defaultTo(5);
    t.decimal('weight', 10, 3);
    t.jsonb('images').notNullable().defaultTo('[]');
    t.jsonb('attributes').notNullable().defaultTo('[]');
    t.jsonb('tags').notNullable().defaultTo('[]');
    t.string('meta_title', 255);
    t.text('meta_description');
    t.decimal('rating_avg', 3, 2).notNullable().defaultTo(0);
    t.integer('rating_count').notNullable().defaultTo(0);
    t.timestamp('published_at');
    t.timestamps(true, true);
    t.unique(['tenant_id', 'slug']);
    t.index(['tenant_id', 'status']);
    t.index(['category_id']);
    t.index(['brand_id']);
  });

  await knex.schema.createTable('inventory_movements', (t) => {
    tenantCol(knex, t);
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.string('type', 20).notNullable();
    t.integer('quantity').notNullable();
    t.string('reason', 255);
    t.string('reference', 100);
    t.uuid('created_by');
    t.timestamps(true, true);
    t.index(['product_id']);
  });

  await knex.schema.createTable('customers', (t) => {
    tenantCol(knex, t);
    t.string('name', 150).notNullable();
    t.string('email', 255).notNullable();
    t.string('phone', 50);
    t.string('password_hash', 255);
    t.string('status', 20).notNullable().defaultTo('active');
    t.boolean('accepts_marketing').notNullable().defaultTo(false);
    t.jsonb('addresses').notNullable().defaultTo('[]');
    t.integer('orders_count').notNullable().defaultTo(0);
    t.decimal('total_spent', 12, 2).notNullable().defaultTo(0);
    t.timestamp('last_order_at');
    t.timestamps(true, true);
    t.unique(['tenant_id', 'email']);
  });

  await knex.schema.createTable('shipping_methods', (t) => {
    tenantCol(knex, t);
    t.string('name', 150).notNullable();
    t.text('description');
    t.string('type', 20).notNullable().defaultTo('flat');
    t.decimal('rate', 12, 2).notNullable().defaultTo(0);
    t.decimal('free_over_amount', 12, 2);
    t.string('estimated_days', 100);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('coupons', (t) => {
    tenantCol(knex, t);
    t.string('code', 50).notNullable();
    t.string('type', 20).notNullable();
    t.decimal('value', 12, 2).notNullable().defaultTo(0);
    t.decimal('min_order_amount', 12, 2);
    t.decimal('max_discount', 12, 2);
    t.integer('usage_limit');
    t.integer('used_count').notNullable().defaultTo(0);
    t.timestamp('starts_at');
    t.timestamp('ends_at');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
    t.unique(['tenant_id', 'code']);
  });

  await knex.schema.createTable('orders', (t) => {
    tenantCol(knex, t);
    t.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
    t.string('order_number', 30).notNullable();
    t.string('email', 255).notNullable();
    t.string('phone', 50);
    t.string('status', 20).notNullable().defaultTo('pending');
    t.string('payment_status', 20).notNullable().defaultTo('pending');
    t.string('fulfillment_status', 20).notNullable().defaultTo('unfulfilled');
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.decimal('subtotal', 12, 2).notNullable().defaultTo(0);
    t.decimal('discount_total', 12, 2).notNullable().defaultTo(0);
    t.decimal('shipping_total', 12, 2).notNullable().defaultTo(0);
    t.decimal('tax_total', 12, 2).notNullable().defaultTo(0);
    t.decimal('grand_total', 12, 2).notNullable().defaultTo(0);
    t.string('coupon_code', 50);
    t.uuid('shipping_method_id').references('id').inTable('shipping_methods').onDelete('SET NULL');
    t.string('shipping_method_name', 150);
    t.jsonb('shipping_address');
    t.jsonb('billing_address');
    t.string('payment_method', 20).notNullable().defaultTo('cod');
    t.text('notes');
    t.string('tracking_number', 100);
    t.timestamp('placed_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('cancelled_at');
    t.timestamps(true, true);
    t.unique(['tenant_id', 'order_number']);
    t.index(['tenant_id', 'status']);
    t.index(['tenant_id', 'placed_at']);
    t.index(['customer_id']);
  });

  await knex.schema.createTable('order_items', (t) => {
    tenantCol(knex, t);
    t.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
    t.string('name', 255).notNullable();
    t.string('sku', 100);
    t.string('image_url', 2048);
    t.decimal('unit_price', 12, 2).notNullable();
    t.integer('quantity').notNullable();
    t.decimal('line_total', 12, 2).notNullable();
    t.timestamps(true, true);
    t.index(['order_id']);
    t.index(['product_id']);
  });

  await knex.schema.createTable('order_status_history', (t) => {
    tenantCol(knex, t);
    t.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.string('status', 20).notNullable();
    t.text('note');
    t.uuid('created_by');
    t.timestamps(true, true);
    t.index(['order_id']);
  });

  await knex.schema.createTable('payments', (t) => {
    tenantCol(knex, t);
    t.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.string('method', 20).notNullable();
    t.decimal('amount', 12, 2).notNullable();
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.string('status', 20).notNullable().defaultTo('pending');
    t.string('transaction_ref', 255);
    t.timestamp('paid_at');
    t.timestamps(true, true);
    t.index(['order_id']);
  });

  await knex.schema.createTable('reviews', (t) => {
    tenantCol(knex, t);
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
    t.string('author_name', 150).notNullable();
    t.smallint('rating').notNullable();
    t.string('title', 255);
    t.text('body');
    t.string('status', 20).notNullable().defaultTo('pending');
    t.timestamps(true, true);
    t.index(['product_id', 'status']);
  });
  await knex.raw('alter table reviews add constraint reviews_rating_check check (rating between 1 and 5)');

  await knex.schema.createTable('pages', (t) => {
    tenantCol(knex, t);
    t.string('title', 255).notNullable();
    t.string('slug', 180).notNullable();
    t.text('content');
    t.boolean('is_published').notNullable().defaultTo(false);
    t.boolean('show_in_footer').notNullable().defaultTo(false);
    t.string('meta_title', 255);
    t.text('meta_description');
    t.timestamps(true, true);
    t.unique(['tenant_id', 'slug']);
  });

  await knex.schema.createTable('notifications', (t) => {
    tenantCol(knex, t);
    t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.string('type', 50).notNullable();
    t.string('title', 255).notNullable();
    t.text('body');
    t.jsonb('data');
    t.timestamp('read_at');
    t.timestamps(true, true);
    t.index(['tenant_id', 'read_at']);
  });

  await knex.schema.createTable('tenant_settings', (t) => {
    tenantCol(knex, t);
    t.string('group', 50).notNullable();
    t.jsonb('value').notNullable().defaultTo('{}');
    t.timestamps(true, true);
    t.unique(['tenant_id', 'group']);
  });
}

export async function down(knex) {
  await knex.schema.alterTable('tenants', (t) => t.dropForeign('owner_id'));
  for (const table of [
    'tenant_settings',
    'notifications',
    'pages',
    'reviews',
    'payments',
    'order_status_history',
    'order_items',
    'orders',
    'coupons',
    'shipping_methods',
    'customers',
    'inventory_movements',
    'products',
    'brands',
    'categories',
    'users',
    'roles',
  ]) {
    await knex.schema.dropTableIfExists(table);
  }
}
