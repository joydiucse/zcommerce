/**
 * Idempotent demo seed (CONTRACT.md §6). Truncates every table, then recreates:
 * system admin + roles, plans, demo tenant (+ a few extra tenants for the platform dashboard),
 * catalog, shipping, coupons, pages, customers, ~25 orders over the last 30 days, reviews, settings.
 */
import bcrypt from 'bcryptjs';
import { Redis } from 'ioredis';
import { CATEGORIES, BRANDS, PRODUCTS, PAGES, CUSTOMERS, REVIEW_SNIPPETS } from './data/catalog.js';
import { calculateTotals } from '../../../shared/helpers/order-totals.js';
import { DEFAULT_TENANT_ROLES, SYSTEM_PERMISSIONS, defaultSettingsFor } from '../../../shared/constants/index.js';
import { slugify, round2, siteHostOf } from '../../../shared/utils/index.js';
import { env } from '../../config/env.js';

const DAY = 86400000;
const json = (v) => JSON.stringify(v);

// Deterministic PRNG so every run produces the same data.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261005);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (min, max) => min + Math.floor(rand() * (max - min + 1));
const daysAgo = (d, hour = 12) => {
  const now = new Date();
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - d, hour, between(0, 59)));
  return t > now ? new Date(now.getTime() - 60000 * between(5, 90)) : t;
};

const TABLES = [
  'audit_logs', 'tenant_settings', 'notifications', 'pages', 'reviews', 'payments', 'order_status_history', 'order_items',
  'orders', 'coupons', 'shipping_methods', 'customers', 'inventory_movements', 'products', 'brands', 'categories',
  'invoices', 'subscriptions', 'users', 'roles', 'tenants', 'plans', 'system_users', 'system_roles',
];

async function flushRedis() {
  const redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 2000, retryStrategy: () => null });
  try {
    await redis.connect();
    for (const pattern of ['tenant:*', 'settings:*', 'perms:*', 'cart:*', 'refresh:*', 'rl:*']) {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(...keys);
    }
  } catch {
    // Redis unavailable: nothing cached to flush.
  } finally {
    redis.disconnect();
  }
}

async function createTenantShell(knex, { name, slug, email, phone, plan, status, customDomain = null, siteUrl = null, createdAt, ownerName, passwordHash }) {
  const [tenant] = await knex('tenants')
    .insert({
      name, slug, email, phone, status, custom_domain: customDomain, site_url: siteUrl, site_host: siteHostOf(siteUrl), plan_id: plan.id,
      trial_ends_at: status === 'trial' ? new Date(Date.now() + 10 * DAY) : null,
      created_at: createdAt, updated_at: createdAt,
    })
    .returning('*');
  const roles = await knex('roles')
    .insert(DEFAULT_TENANT_ROLES.map((r) => ({ ...r, tenant_id: tenant.id, permissions: json(r.permissions), created_at: createdAt })))
    .returning('*');
  const roleBy = Object.fromEntries(roles.map((r) => [r.name, r]));
  const [owner] = await knex('users')
    .insert({ tenant_id: tenant.id, name: ownerName, email, password_hash: passwordHash, role_id: roleBy.Owner.id, status: 'active', created_at: createdAt })
    .returning('*');
  await knex('tenants').where({ id: tenant.id }).update({ owner_id: owner.id });
  return { tenant: { ...tenant, owner_id: owner.id }, roles: roleBy, owner };
}

export async function seed(knex) {
  await knex.raw(`truncate table ${TABLES.map((t) => `"${t}"`).join(', ')} restart identity cascade`);
  await knex.raw(`alter sequence invoice_number_seq restart with 1`);
  await flushRedis();

  const passwordHash = await bcrypt.hash('password123', 10);
  const now = new Date();

  // ---------------------------------------------------------------- system
  const [superAdminRole, supportRole] = await knex('system_roles')
    .insert([
      { name: 'Super Admin', description: 'Full platform access', permissions: json(['*']), is_system: true },
      { name: 'Support', description: 'Read-only access to tenants and billing', permissions: json(SYSTEM_PERMISSIONS.filter((p) => p.endsWith('.view'))), is_system: false },
    ])
    .returning('*');
  const [admin] = await knex('system_users')
    .insert([
      { name: 'Platform Admin', email: 'admin@zcommerce.test', password_hash: passwordHash, role_id: superAdminRole.id, status: 'active' },
      { name: 'Sam Support', email: 'support@zcommerce.test', password_hash: passwordHash, role_id: supportRole.id, status: 'active' },
    ])
    .returning('*');

  const plans = await knex('plans')
    .insert([
      {
        name: 'Starter', slug: 'starter', description: 'Everything you need to start selling online.', price_monthly: 19, price_yearly: 190,
        limits: json({ products: 100, staff: 2, storage_mb: 1024 }), features: json(['Up to 100 products', '2 staff accounts', 'Custom domain', 'Email support']), sort_order: 1,
      },
      {
        name: 'Growth', slug: 'growth', description: 'For growing brands that need more room.', price_monthly: 49, price_yearly: 490,
        limits: json({ products: 1000, staff: 5, storage_mb: 5120 }), features: json(['Up to 1,000 products', '5 staff accounts', 'Advanced reports', 'Coupons & discounts', 'Priority support']), sort_order: 2,
      },
      {
        name: 'Pro', slug: 'pro', description: 'Unlimited scale for established stores.', price_monthly: 99, price_yearly: 990,
        limits: json({ products: 100000, staff: 25, storage_mb: 51200 }), features: json(['Unlimited products', '25 staff accounts', 'API access', 'Dedicated success manager']), sort_order: 3,
      },
    ])
    .returning('*');
  const planBy = Object.fromEntries(plans.map((p) => [p.slug, p]));

  // ---------------------------------------------------------------- tenants
  const demoCreated = new Date(now.getTime() - 200 * DAY);
  const { tenant: demo, roles: demoRoles, owner } = await createTenantShell(knex, {
    name: 'Demo Store', slug: 'demo', email: 'owner@demo.test', phone: '+1 555 010 2030', plan: planBy.growth, status: 'active',
    siteUrl: 'http://localhost:3001', createdAt: demoCreated, ownerName: 'Olivia Owner', passwordHash,
  });
  await knex('users').insert([
    { tenant_id: demo.id, name: 'Marcus Manager', email: 'manager@demo.test', password_hash: passwordHash, role_id: demoRoles.Manager.id, status: 'active' },
    { tenant_id: demo.id, name: 'Sophie Staff', email: 'staff@demo.test', password_hash: passwordHash, role_id: demoRoles.Staff.id, status: 'active' },
  ]);

  const extraTenants = [
    { name: 'Bloom Botanicals', slug: 'bloom', plan: planBy.starter, status: 'active', months: 7, siteUrl: 'http://localhost:3002' },
    { name: 'Acme Outfitters', slug: 'acme', plan: planBy.pro, status: 'active', months: 4 },
    { name: 'Pixel Prints', slug: 'pixel', plan: planBy.starter, status: 'trial', months: 0 },
    { name: 'Corner Bakery Co', slug: 'corner-bakery', plan: planBy.growth, status: 'trial', months: 1 },
    { name: 'Retro Records', slug: 'retro', plan: planBy.starter, status: 'suspended', months: 9, siteUrl: 'http://localhost:3003' },
  ];
  const extra = [];
  for (const t of extraTenants) {
    const createdAt = new Date(now.getTime() - (t.months * 30 + between(1, 20)) * DAY);
    const shell = await createTenantShell(knex, {
      name: t.name, slug: t.slug, email: `owner@${t.slug}.test`, phone: null, plan: t.plan, status: t.status, siteUrl: t.siteUrl, createdAt,
      ownerName: `${t.name.split(' ')[0]} Owner`, passwordHash,
    });
    await knex('tenant_settings').insert(Object.entries(defaultSettingsFor(t.name, `owner@${t.slug}.test`)).map(([group, value]) => ({ tenant_id: shell.tenant.id, group, value: json(value) })));
    extra.push({ ...t, tenant: shell.tenant, createdAt });
  }

  // ---------------------------------------------------------------- subscriptions + invoices
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const [demoSub] = await knex('subscriptions')
    .insert({ tenant_id: demo.id, plan_id: planBy.growth.id, status: 'active', billing_cycle: 'monthly', amount: 49, current_period_start: periodStart, current_period_end: periodEnd, created_at: demoCreated })
    .returning('*');
  const subs = [];
  for (const t of extra) {
    const status = t.status === 'trial' ? 'trialing' : t.status === 'suspended' ? 'past_due' : 'active';
    const cycle = t.slug === 'acme' ? 'yearly' : 'monthly';
    const [s] = await knex('subscriptions')
      .insert({
        tenant_id: t.tenant.id, plan_id: t.plan.id, status, billing_cycle: cycle,
        amount: cycle === 'yearly' ? t.plan.price_yearly : t.plan.price_monthly,
        current_period_start: periodStart, current_period_end: cycle === 'yearly' ? new Date(periodStart.getTime() + 365 * DAY) : periodEnd, created_at: t.createdAt,
      })
      .returning('*');
    subs.push({ ...t, sub: s });
  }

  const invoiceRows = [];
  const addInvoice = async (tenantId, subId, amount, status, issuedAt, label) => {
    const { rows } = await knex.raw(`select nextval('invoice_number_seq')::int as n`);
    invoiceRows.push({
      tenant_id: tenantId, subscription_id: subId, number: `INV-${String(rows[0].n).padStart(6, '0')}`, amount, currency: 'USD', status,
      due_date: new Date(issuedAt.getTime() + 14 * DAY), paid_at: status === 'paid' ? new Date(issuedAt.getTime() + 2 * DAY) : null,
      items: json([{ description: label, quantity: 1, unit_price: amount, amount }]), created_at: issuedAt, updated_at: issuedAt,
    });
  };
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  await addInvoice(demo.id, demoSub.id, 49, 'paid', lastMonth, 'Growth plan — monthly');
  await addInvoice(demo.id, demoSub.id, 49, 'open', periodStart, 'Growth plan — monthly');
  for (const s of subs.filter((x) => x.status !== 'trial')) {
    await addInvoice(s.tenant.id, s.sub.id, s.sub.amount, s.status === 'suspended' ? 'open' : 'paid', lastMonth, `${s.plan.name} plan — ${s.sub.billing_cycle}`);
  }
  await knex('invoices').insert(invoiceRows);

  // ---------------------------------------------------------------- demo catalog
  const T = demo.id;
  const catBy = {};
  for (const c of CATEGORIES) {
    const [row] = await knex('categories')
      .insert({
        tenant_id: T, parent_id: c.parent ? catBy[c.parent].id : null, name: c.name, slug: c.key, description: c.description,
        image_url: `https://picsum.photos/seed/cat-${c.key}/800/600`, is_active: true, sort_order: c.sort_order,
        meta_title: `${c.name} | Demo Store`, meta_description: c.description,
      })
      .returning('*');
    catBy[c.key] = row;
  }
  const brandBy = {};
  for (const b of BRANDS) {
    const [row] = await knex('brands')
      .insert({ tenant_id: T, name: b.name, slug: b.key, description: b.description, logo_url: `https://picsum.photos/seed/brand-${b.key}/400/400`, is_active: true, meta_title: b.name, meta_description: b.description })
      .returning('*');
    brandBy[b.key] = row;
  }

  const products = [];
  for (const [i, p] of PRODUCTS.entries()) {
    const slug = slugify(p.name);
    const createdAt = new Date(now.getTime() - (60 - i * 2) * DAY);
    const status = p.status || 'active';
    const [row] = await knex('products')
      .insert({
        tenant_id: T, category_id: catBy[p.category].id, brand_id: brandBy[p.brand].id, name: p.name, slug,
        sku: `${p.brand.slice(0, 3).toUpperCase()}-${String(1001 + i)}`, short_description: p.short, description: p.description,
        price: p.price, compare_at_price: p.compare, cost_price: p.cost, status, is_featured: p.featured, track_inventory: true,
        stock_quantity: p.stock, low_stock_threshold: 5, weight: p.weight,
        images: json([
          { url: `https://picsum.photos/seed/${slug}/800/800`, alt: p.name },
          { url: `https://picsum.photos/seed/${slug}-2/800/800`, alt: `${p.name} — detail` },
          { url: `https://picsum.photos/seed/${slug}-3/800/800`, alt: `${p.name} — lifestyle` },
        ]),
        attributes: json(p.attributes.map(([name, value]) => ({ name, value }))), tags: json(p.tags),
        meta_title: p.name, meta_description: p.short, published_at: status === 'active' ? createdAt : null,
        created_at: createdAt, updated_at: createdAt,
      })
      .returning('*');
    products.push(row);
    if (p.stock > 0) {
      await knex('inventory_movements').insert({ tenant_id: T, product_id: row.id, type: 'restock', quantity: p.stock, reason: 'Initial stock', reference: 'SEED', created_by: owner.id, created_at: createdAt });
    }
  }
  const sellable = products.filter((p) => p.status === 'active');

  // ---------------------------------------------------------------- shipping, coupons, pages
  const shipping = await knex('shipping_methods')
    .insert([
      { tenant_id: T, name: 'Standard Shipping', description: 'Free on orders over $50', type: 'free_over', rate: 5.99, free_over_amount: 50, estimated_days: '3-5 business days', sort_order: 1 },
      { tenant_id: T, name: 'Express Shipping', description: 'Priority handling and delivery', type: 'flat', rate: 14.99, free_over_amount: null, estimated_days: '1-2 business days', sort_order: 2 },
      { tenant_id: T, name: 'Store Pickup', description: 'Pick up from our San Francisco studio', type: 'free', rate: 0, free_over_amount: null, estimated_days: 'Ready in 24 hours', sort_order: 3 },
    ])
    .returning('*');
  const coupons = await knex('coupons')
    .insert([
      { tenant_id: T, code: 'WELCOME10', type: 'percent', value: 10, min_order_amount: null, max_discount: 50, usage_limit: null, is_active: true },
      { tenant_id: T, code: 'FREESHIP', type: 'free_shipping', value: 0, min_order_amount: 25, max_discount: null, usage_limit: 500, is_active: true },
    ])
    .returning('*');
  const couponBy = Object.fromEntries(coupons.map((c) => [c.code, c]));
  await knex('pages').insert(PAGES.map((p) => ({ tenant_id: T, ...p, is_published: true, meta_title: p.title, meta_description: `${p.title} — Demo Store` })));

  // ---------------------------------------------------------------- customers
  const customers = [];
  for (const [i, [name, email, phone, city, state, postal]] of CUSTOMERS.entries()) {
    const address = { name, phone, line1: `${100 + i * 7} ${pick(['Oak', 'Pine', 'Maple', 'Cedar', 'Elm'])} Street`, line2: '', city, state, postal_code: postal, country: 'US' };
    const [row] = await knex('customers')
      .insert({
        tenant_id: T, name, email, phone, password_hash: i < 6 ? passwordHash : null, status: 'active', accepts_marketing: i % 2 === 0,
        addresses: json([address]), created_at: new Date(now.getTime() - (45 + i * 3) * DAY),
      })
      .returning('*');
    customers.push({ ...row, address });
  }

  // ---------------------------------------------------------------- orders (~25 over the last 30 days)
  const statusPlan = [
    'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'shipped', 'shipped',
    'delivered', 'shipped', 'processing', 'delivered', 'cancelled', 'delivered', 'processing', 'shipped', 'confirmed', 'refunded',
    'confirmed', 'processing', 'pending', 'pending', 'pending',
  ];
  const flow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const checkoutCfg = { tax_rate: 0, tax_inclusive: false };
  const stats = new Map();
  const orderRows = [];
  for (let i = 0; i < statusPlan.length; i += 1) {
    const status = statusPlan[i];
    const age = Math.max(0, Math.round(29 - (i * 29) / (statusPlan.length - 1)) + (i > 20 ? 0 : between(-1, 1)));
    const placedAt = daysAgo(Math.max(0, Math.min(29, age)), between(8, 21));
    const customer = customers[i % customers.length];
    const lines = [];
    const used = new Set();
    for (let n = 0; n < between(1, 3); n += 1) {
      const p = pick(sellable);
      if (used.has(p.id)) continue;
      used.add(p.id);
      const quantity = between(1, p.price > 150 ? 1 : 3);
      lines.push({ product: p, quantity, price: p.price });
    }
    const coupon = i % 6 === 2 ? couponBy.WELCOME10 : i % 9 === 4 ? couponBy.FREESHIP : null;
    const method = i % 5 === 3 ? shipping[1] : i % 7 === 6 ? shipping[2] : shipping[0];
    const totals = calculateTotals({ items: lines, coupon, shippingMethod: method, checkout: checkoutCfg });
    const paymentMethod = i % 4 === 1 ? 'manual' : 'cod';
    const paymentStatus = status === 'refunded' ? 'refunded' : status === 'delivered' || (paymentMethod === 'manual' && !['pending', 'cancelled'].includes(status)) ? 'paid' : 'pending';
    orderRows.push({ i, status, placedAt, customer, lines, coupon, method, totals, paymentMethod, paymentStatus });
  }
  orderRows.sort((a, b) => a.placedAt - b.placedAt);

  for (const [idx, o] of orderRows.entries()) {
    const orderNumber = String(1001 + idx);
    const [order] = await knex('orders')
      .insert({
        tenant_id: T, customer_id: o.customer.id, order_number: orderNumber, email: o.customer.email, phone: o.customer.phone,
        status: o.status, payment_status: o.paymentStatus, fulfillment_status: ['shipped', 'delivered'].includes(o.status) ? 'fulfilled' : 'unfulfilled',
        currency: 'USD', subtotal: o.totals.subtotal, discount_total: o.totals.discount_total, shipping_total: o.totals.shipping_total,
        tax_total: o.totals.tax_total, grand_total: o.totals.grand_total, coupon_code: o.coupon?.code || null,
        shipping_method_id: o.method.id, shipping_method_name: o.method.name, shipping_address: json(o.customer.address), billing_address: json(o.customer.address),
        payment_method: o.paymentMethod, notes: idx % 8 === 3 ? 'Please leave the parcel at the front desk.' : null,
        tracking_number: ['shipped', 'delivered'].includes(o.status) ? `1Z${String(880000000 + idx * 7919)}` : null,
        placed_at: o.placedAt, cancelled_at: o.status === 'cancelled' ? new Date(o.placedAt.getTime() + 3 * 3600000) : null,
        created_at: o.placedAt, updated_at: o.placedAt,
      })
      .returning('*');

    await knex('order_items').insert(
      o.lines.map((l) => ({
        tenant_id: T, order_id: order.id, product_id: l.product.id, name: l.product.name, sku: l.product.sku, image_url: l.product.images[0]?.url || null,
        unit_price: l.price, quantity: l.quantity, line_total: round2(l.price * l.quantity), created_at: o.placedAt,
      })),
    );

    // Status history follows the normal flow up to the final status.
    const steps = ['cancelled', 'refunded'].includes(o.status) ? ['pending', ...(o.status === 'refunded' ? ['confirmed', 'delivered'] : []), o.status] : flow.slice(0, flow.indexOf(o.status) + 1);
    await knex('order_status_history').insert(
      steps.map((s, n) => ({
        tenant_id: T, order_id: order.id, status: s, note: n === 0 ? 'Order placed' : null, created_by: n === 0 ? null : owner.id,
        created_at: new Date(o.placedAt.getTime() + n * 9 * 3600000),
      })),
    );
    await knex('payments').insert({
      tenant_id: T, order_id: order.id, method: o.paymentMethod, amount: o.totals.grand_total, currency: 'USD', status: o.paymentStatus,
      transaction_ref: o.paymentMethod === 'manual' && o.paymentStatus !== 'pending' ? `BANK-${orderNumber}` : null,
      paid_at: o.paymentStatus === 'paid' ? new Date(o.placedAt.getTime() + 24 * 3600000) : null, created_at: o.placedAt,
    });
    await knex('inventory_movements').insert(
      o.lines.map((l) => ({ tenant_id: T, product_id: l.product.id, type: 'sale', quantity: -l.quantity, reason: `Order #${orderNumber}`, reference: orderNumber, created_at: o.placedAt })),
    );
    if (o.coupon) await knex('coupons').where({ id: o.coupon.id }).increment('used_count', 1);

    if (!['cancelled', 'refunded'].includes(o.status)) {
      const s = stats.get(o.customer.id) || { count: 0, spent: 0, last: null };
      s.count += 1;
      s.spent = round2(s.spent + o.totals.grand_total);
      s.last = o.placedAt;
      stats.set(o.customer.id, s);
    }
  }
  for (const [customerId, s] of stats) {
    await knex('customers').where({ id: customerId }).update({ orders_count: s.count, total_spent: s.spent, last_order_at: s.last });
  }

  // ---------------------------------------------------------------- reviews
  const reviewRows = [];
  for (const [i, p] of sellable.entries()) {
    const n = i % 4 === 3 ? 0 : between(1, 4);
    for (let k = 0; k < n; k += 1) {
      const [rating, title, body] = REVIEW_SNIPPETS[(i + k) % REVIEW_SNIPPETS.length];
      const c = customers[(i + k) % customers.length];
      reviewRows.push({ tenant_id: T, product_id: p.id, customer_id: c.id, author_name: c.name.split(' ')[0] + ' ' + c.name.split(' ')[1][0] + '.', rating, title, body, status: 'approved', created_at: daysAgo(between(1, 40)) });
    }
  }
  reviewRows.push(
    { tenant_id: T, product_id: sellable[0].id, customer_id: null, author_name: 'Alex P.', rating: 2, title: 'Not for me', body: 'The fit was too tight for my head.', status: 'pending', created_at: daysAgo(1) },
    { tenant_id: T, product_id: sellable[4].id, customer_id: customers[2].id, author_name: 'Esther H.', rating: 5, title: 'Fantastic battery', body: 'Lasts a full week, as promised.', status: 'pending', created_at: daysAgo(0) },
  );
  await knex('reviews').insert(reviewRows);
  await knex.raw(
    `update products p set rating_avg = coalesce(r.avg, 0), rating_count = coalesce(r.cnt, 0)
       from (select product_id, round(avg(rating)::numeric, 2) as avg, count(*)::int as cnt from reviews where status = 'approved' and tenant_id = ? group by product_id) r
      where p.id = r.product_id`,
    [T],
  );

  // ---------------------------------------------------------------- settings
  const settings = defaultSettingsFor('Demo Store', 'hello@demo.test');
  settings.general = { ...settings.general, tagline: 'Thoughtfully made goods for everyday life', logo_url: null, contact_phone: '+1 (555) 010-2030', address: '123 Market Street, San Francisco, CA 94103' };
  settings.seo = {
    ...settings.seo, meta_description: 'Shop headphones, smart wearables, homeware, apparel and outdoor gear from independent brands. Free shipping over $50.',
    meta_keywords: 'electronics, audio, homeware, apparel, outdoor gear', og_image_url: 'https://picsum.photos/seed/demo-og/1200/630', twitter_handle: '@demostore', canonical_url: '',
  };
  settings.social = { facebook: 'https://facebook.com/demostore', instagram: 'https://instagram.com/demostore', twitter: 'https://x.com/demostore', youtube: '', tiktok: '', linkedin: '' };
  settings.homepage = {
    announcement_bar: { enabled: true, text: 'Free shipping over $50 — use WELCOME10 for 10% off your first order', link: '/products' },
    hero_slides: [
      { image_url: 'https://picsum.photos/seed/hero-audio/1600/700', title: 'Sound, perfected', subtitle: 'New Sonora headphones with adaptive noise cancellation.', cta_text: 'Shop audio', cta_link: '/categories/audio' },
      { image_url: 'https://picsum.photos/seed/hero-outdoors/1600/700', title: 'Built for the trail', subtitle: 'Lightweight Northpeak gear for every adventure.', cta_text: 'Explore outdoors', cta_link: '/categories/sports-outdoors' },
      { image_url: 'https://picsum.photos/seed/hero-home/1600/700', title: 'Slow mornings', subtitle: 'Pour-over sets and stoneware from Lumen Home.', cta_text: 'Shop home', cta_link: '/categories/home-kitchen' },
    ],
    featured_category_ids: [catBy.audio.id, catBy.wearables.id, catBy['home-kitchen'].id, catBy['sports-outdoors'].id],
    sections: { featured_products: true, new_arrivals: true, categories: true, brands: true, newsletter: true },
    products_per_section: 8,
  };
  settings.navigation = {
    header_menu: [
      { label: 'Shop', url: '/products' },
      { label: 'Electronics', url: '/categories/electronics' },
      { label: 'Home & Kitchen', url: '/categories/home-kitchen' },
      { label: 'Apparel', url: '/categories/apparel' },
      { label: 'Outdoors', url: '/categories/sports-outdoors' },
    ],
    footer_menus: [
      { title: 'Shop', links: [{ label: 'All products', url: '/products' }, { label: 'Featured', url: '/products?featured=true' }, { label: 'Brands', url: '/brands' }] },
      { title: 'Help', links: [{ label: 'Contact', url: '/pages/contact' }, { label: 'Shipping & Returns', url: '/pages/shipping-returns' }] },
      { title: 'Company', links: [{ label: 'About us', url: '/pages/about' }, { label: 'Terms', url: '/pages/terms' }, { label: 'Privacy', url: '/pages/privacy' }] },
    ],
  };
  settings.checkout = { ...settings.checkout, manual_payment_instructions: 'Transfer the order total to IBAN US00 DEMO 0000 1234 5678 and use your order number as reference.' };
  settings.notifications = { admin_order_email: 'owner@demo.test', low_stock_alerts: true, customer_order_emails: true };
  await knex('tenant_settings').insert(Object.entries(settings).map(([group, value]) => ({ tenant_id: T, group, value: json(value) })));

  // ---------------------------------------------------------------- notifications + audit logs
  const recent = orderRows.slice(-3);
  await knex('notifications').insert([
    ...recent.map((o, n) => ({
      tenant_id: T, type: 'order.placed', title: `New order #${1001 + orderRows.length - 3 + n}`, body: `${o.customer.name} placed an order for $${o.totals.grand_total.toFixed(2)}`,
      data: json({ order_number: String(1001 + orderRows.length - 3 + n) }), read_at: n === 0 ? new Date() : null, created_at: o.placedAt,
    })),
    ...products.filter((p) => p.track_inventory && p.stock_quantity <= 5 && p.status === 'active').map((p) => ({
      tenant_id: T, type: 'stock.low', title: p.stock_quantity <= 0 ? `Out of stock: ${p.name}` : `Low stock: ${p.name}`,
      body: `${p.name} (${p.sku}) has ${p.stock_quantity} left in stock.`, data: json({ product_id: p.id, stock_quantity: p.stock_quantity }), created_at: daysAgo(between(0, 3)),
    })),
  ]);

  await knex('audit_logs').insert([
    { actor_type: 'system', actor_id: admin.id, tenant_id: demo.id, action: 'tenant.created', entity_type: 'tenant', entity_id: demo.id, changes: json({ name: 'Demo Store', slug: 'demo' }), created_at: demoCreated },
    ...extra.map((t) => ({ actor_type: 'system', actor_id: admin.id, tenant_id: t.tenant.id, action: 'tenant.created', entity_type: 'tenant', entity_id: t.tenant.id, changes: json({ name: t.name, slug: t.slug }), created_at: t.createdAt })),
    { actor_type: 'system', actor_id: admin.id, tenant_id: extra[4].tenant.id, action: 'tenant.suspended', entity_type: 'tenant', entity_id: extra[4].tenant.id, changes: json({ from: 'active', to: 'suspended' }), created_at: daysAgo(12) },
    { actor_type: 'system', actor_id: admin.id, tenant_id: demo.id, action: 'invoice.marked_paid', entity_type: 'invoice', entity_id: null, changes: json({ number: 'INV-000001', amount: 49 }), created_at: daysAgo(25) },
  ]);
}
