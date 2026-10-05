/** System-side tables: roles, users, plans, tenants, subscriptions, invoices, audit logs. */
export async function up(knex) {
  await knex.schema.createTable('system_roles', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 100).notNullable().unique();
    t.text('description');
    t.jsonb('permissions').notNullable().defaultTo('[]');
    t.boolean('is_system').notNullable().defaultTo(false);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('system_users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 150).notNullable();
    t.string('email', 255).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.uuid('role_id').references('id').inTable('system_roles').onDelete('RESTRICT');
    t.string('status', 20).notNullable().defaultTo('active');
    t.timestamp('last_login_at');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('plans', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 100).notNullable();
    t.string('slug', 100).notNullable().unique();
    t.text('description');
    t.decimal('price_monthly', 12, 2).notNullable().defaultTo(0);
    t.decimal('price_yearly', 12, 2).notNullable().defaultTo(0);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.jsonb('limits').notNullable().defaultTo(JSON.stringify({ products: 100, staff: 2, storage_mb: 500 }));
    t.jsonb('features').notNullable().defaultTo('[]');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('tenants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 150).notNullable();
    t.string('slug', 100).notNullable().unique();
    t.string('custom_domain', 255).unique();
    t.string('email', 255).notNullable();
    t.string('phone', 50);
    t.string('status', 20).notNullable().defaultTo('trial');
    t.uuid('plan_id').references('id').inTable('plans').onDelete('SET NULL');
    t.timestamp('trial_ends_at');
    t.uuid('owner_id'); // FK to users added in the tenant migration
    t.timestamps(true, true);
    t.index(['status']);
  });

  await knex.schema.createTable('subscriptions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    t.uuid('plan_id').notNullable().references('id').inTable('plans').onDelete('RESTRICT');
    t.string('status', 20).notNullable().defaultTo('trialing');
    t.string('billing_cycle', 10).notNullable().defaultTo('monthly');
    t.decimal('amount', 12, 2).notNullable().defaultTo(0);
    t.timestamp('current_period_start');
    t.timestamp('current_period_end');
    t.timestamp('canceled_at');
    t.timestamps(true, true);
    t.index(['tenant_id']);
    t.index(['status']);
  });

  await knex.schema.createTable('invoices', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    t.uuid('subscription_id').references('id').inTable('subscriptions').onDelete('SET NULL');
    t.string('number', 30).notNullable().unique();
    t.decimal('amount', 12, 2).notNullable().defaultTo(0);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.string('status', 20).notNullable().defaultTo('open');
    t.date('due_date');
    t.timestamp('paid_at');
    t.jsonb('items').notNullable().defaultTo('[]');
    t.timestamps(true, true);
    t.index(['tenant_id']);
    t.index(['status']);
  });

  await knex.schema.createTable('audit_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('actor_type', 20).notNullable();
    t.uuid('actor_id');
    t.uuid('tenant_id').references('id').inTable('tenants').onDelete('SET NULL');
    t.string('action', 100).notNullable();
    t.string('entity_type', 50);
    t.uuid('entity_id');
    t.jsonb('changes');
    t.string('ip', 64);
    t.text('user_agent');
    t.timestamps(true, true);
    t.index(['tenant_id']);
    t.index(['action']);
    t.index(['created_at']);
  });

  await knex.raw(`create sequence if not exists invoice_number_seq start 1`);
}

export async function down(knex) {
  await knex.raw('drop sequence if exists invoice_number_seq');
  for (const table of ['audit_logs', 'invoices', 'subscriptions', 'tenants', 'plans', 'system_users', 'system_roles']) {
    await knex.schema.dropTableIfExists(table);
  }
}
