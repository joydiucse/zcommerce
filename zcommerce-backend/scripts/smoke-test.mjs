#!/usr/bin/env node
/**
 * End-to-end smoke test against a running API (default http://localhost:4000).
 *   node scripts/smoke-test.mjs [baseUrl]
 * Requires a freshly seeded database (npm run seed). Exits non-zero on any failure.
 */
const ROOT = (process.argv[2] || process.env.API_ROOT || 'http://localhost:4000').replace(/\/+$/, '');
const B = `${ROOT}/api/v1`;
let pass = 0;
let fail = 0;

async function call(method, path, { body, token, headers = {}, form } = {}) {
  const h = { ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(path.startsWith('http') ? path : `${B}${path}`, { method, headers: h, body: payload });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* not json */
  }
  return { status: res.status, json, headers: res.headers };
}

function check(name, cond, extra) {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name}${extra ? ` -> ${typeof extra === 'string' ? extra : JSON.stringify(extra).slice(0, 400)}` : ''}`);
  }
}

const store = { 'X-Tenant': 'demo' };

async function main() {
  console.log(`Smoke testing ${B}\n`);

  // ---- health
  console.log('Health');
  let r = await call('GET', `${ROOT}/health`);
  check('GET /health', r.status === 200 && r.json.status === 'ok' && r.json.db === 'up', r.json);
  check('X-Request-Id header', Boolean(r.headers.get('x-request-id')));
  r = await call('GET', '/health');
  check('GET /api/v1/health', r.status === 200 && r.json.data.redis === 'up', r.json);

  // ---- system
  console.log('System');
  r = await call('POST', '/system/auth/login', { body: { email: 'admin@zcommerce.test', password: 'password123' } });
  check('system login', r.status === 200 && r.json.data.access_token && r.json.data.user.role.name === 'Super Admin', r.json);
  const sys = r.json.data.access_token;
  const sysRefresh = r.json.data.refresh_token;
  r = await call('GET', '/system/auth/me', { token: sys });
  check('system me', r.status === 200 && r.json.data.permissions.includes('*'), r.json);
  r = await call('POST', '/system/auth/refresh', { body: { refresh_token: sysRefresh } });
  check('system refresh rotates', r.status === 200 && r.json.data.refresh_token !== sysRefresh, r.json);
  const r2 = await call('POST', '/system/auth/refresh', { body: { refresh_token: sysRefresh } });
  check('old refresh token revoked', r2.status === 401, r2.json);
  r = await call('GET', '/system/dashboard', { token: sys });
  check('system dashboard', r.status === 200 && r.json.data.tenants_total >= 1 && Array.isArray(r.json.data.tenants_by_month) && typeof r.json.data.mrr === 'number', r.json);
  r = await call('GET', '/system/tenants?limit=5&sort=name&order=asc', { token: sys });
  check('system tenants list + meta', r.status === 200 && r.json.meta.total >= 1 && r.json.meta.limit === 5, r.json);
  const demoTenant = r.json.data.find((t) => t.slug === 'demo') || (await call('GET', '/system/tenants?search=demo', { token: sys })).json.data[0];
  r = await call('GET', '/system/permissions', { token: sys });
  check('system permissions grouped', r.status === 200 && r.json.data[0].group && r.json.data[0].keys.length, r.json);
  r = await call('GET', '/system/billing/invoices', { token: sys });
  check('system invoices', r.status === 200 && r.json.data.length >= 2, r.json);
  r = await call('GET', '/system/plans', { token: sys });
  check('system plans', r.status === 200 && r.json.data.length === 3, r.json);
  r = await call('POST', '/system/tenants', {
    token: sys,
    body: { name: 'Smoke Shop', slug: `smoke-${Date.now().toString(36)}`, email: 'smoke@shop.test', owner: { name: 'Smoke Owner', email: 'owner@smoke.test', password: 'password123' } },
  });
  check('system create tenant (provisioning)', r.status === 201 && r.json.data.owner?.email === 'owner@smoke.test' && r.json.data.subscription, r.json);
  const smokeTenant = r.json.data;
  if (smokeTenant?.id) {
    r = await call('POST', `/system/tenants/${smokeTenant.id}/suspend`, { token: sys });
    check('system suspend tenant', r.status === 200 && r.json.data.status === 'suspended', r.json);
    r = await call('POST', '/tenant/auth/login', { body: { tenant: smokeTenant.slug, email: 'owner@smoke.test', password: 'password123' } });
    check('suspended tenant login -> TENANT_SUSPENDED', r.status === 403 && r.json.error.code === 'TENANT_SUSPENDED', r.json);
    r = await call('DELETE', `/system/tenants/${smokeTenant.id}`, { token: sys });
    check('system delete tenant', r.status === 200, r.json);
  }
  r = await call('GET', '/system/audit-logs?action=tenant', { token: sys });
  check('audit logs recorded', r.status === 200 && r.json.data.some((l) => l.action === 'tenant.suspended'), r.json);
  r = await call('GET', '/system/tenants', { token: undefined });
  check('system without token -> 401', r.status === 401 && r.json.error.code === 'UNAUTHENTICATED', r.json);

  // ---- tenant
  console.log('Tenant');
  r = await call('POST', '/tenant/auth/login', { body: { tenant: 'demo', email: 'owner@demo.test', password: 'password123' } });
  check('tenant login', r.status === 200 && r.json.data.access_token, r.json);
  const ten = r.json.data.access_token;
  r = await call('GET', '/tenant/auth/me', { token: ten });
  check('tenant me', r.status === 200 && r.json.data.tenant.slug === 'demo' && r.json.data.permissions.includes('*'), r.json);
  r = await call('GET', '/tenant/dashboard', { token: ten });
  check(
    'tenant dashboard',
    r.status === 200 && r.json.data.sales_chart.length === 30 && r.json.data.recent_orders.length > 0 && typeof r.json.data.revenue_month === 'number',
    r.json,
  );
  r = await call('GET', '/tenant/products?limit=5&sort=price&order=desc&status=active', { token: ten });
  check('tenant products list (filter+sort)', r.status === 200 && r.json.data.length === 5 && r.json.data[0].price >= r.json.data[1].price && r.json.data[0].category?.name, r.json);
  r = await call('GET', '/tenant/products?stock=low', { token: ten });
  check('tenant products stock=low', r.status === 200 && r.json.data.every((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold), r.json);
  r = await call('GET', '/tenant/categories?all=true', { token: ten });
  check('tenant categories all=true', r.status === 200 && Array.isArray(r.json.data) && !r.json.meta && r.json.data.length === 6, r.json);
  const categoryId = r.json.data[0].id;
  r = await call('POST', '/tenant/products', { token: ten, body: { name: 'Smoke Test Product', price: 12.5, status: 'active', stock_quantity: 10, category_id: categoryId } });
  check('tenant create product', r.status === 201 && r.json.data.slug === 'smoke-test-product' && r.json.data.price === 12.5, r.json);
  const pid = r.json.data.id;
  r = await call('PUT', `/tenant/products/${pid}`, { token: ten, body: { price: 15, stock_quantity: 7 } });
  check('tenant update product', r.status === 200 && r.json.data.price === 15 && r.json.data.stock_quantity === 7, r.json);
  r = await call('POST', '/tenant/products', { token: ten, body: { name: 'Dup', slug: 'smoke-test-product', price: 1 } });
  check('duplicate slug -> 409 CONFLICT', r.status === 409 && r.json.error.code === 'CONFLICT', r.json);
  r = await call('DELETE', `/tenant/products/${pid}`, { token: ten });
  check('tenant delete product', r.status === 200, r.json);
  r = await call('GET', `/tenant/products/${pid}`, { token: ten });
  check('deleted product -> 404', r.status === 404 && r.json.error.code === 'NOT_FOUND', r.json);
  r = await call('POST', '/tenant/products', { token: ten, body: { name: '', price: -1 } });
  check('validation -> 422 with details', r.status === 422 && r.json.error.code === 'VALIDATION_ERROR' && r.json.error.details.length >= 2, r.json);
  r = await call('PUT', '/tenant/settings/theme', { token: ten, body: { primary_color: '#e11d48', border_radius: 'lg' } });
  check('PUT settings/theme', r.status === 200 && r.json.data.primary_color === '#e11d48' && r.json.data.font_family === 'Inter', r.json);
  r = await call('PUT', '/tenant/settings/theme', { token: ten, body: { primary_color: 'red' } });
  check('invalid theme -> 422', r.status === 422 && r.json.error.details[0].path === 'primary_color', r.json);
  r = await call('GET', '/tenant/settings', { token: ten });
  check('GET settings (all groups)', r.status === 200 && r.json.data.notifications && r.json.data.homepage.hero_slides.length === 3, r.json);

  // 1x1 PNG upload
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const fd = new FormData();
  fd.append('file', new Blob([png], { type: 'image/png' }), 'pixel.png');
  r = await call('POST', '/tenant/uploads', { token: ten, form: fd });
  check('upload image', r.status === 201 && r.json.data.url.startsWith('http') && r.json.data.mime === 'image/png', r.json);
  if (r.json?.data?.url) {
    const img = await fetch(r.json.data.url);
    check('uploaded file served from /storage', img.status === 200);
  }
  const fd2 = new FormData();
  fd2.append('file', new Blob(['hello'], { type: 'text/plain' }), 'x.txt');
  r = await call('POST', '/tenant/uploads', { token: ten, form: fd2 });
  check('non-image upload -> 422', r.status === 422, r.json);

  r = await call('GET', '/tenant/reports/sales?group_by=week', { token: ten });
  check('reports/sales', r.status === 200 && r.json.data.summary.orders > 0 && r.json.data.series.length > 0, r.json);
  r = await call('GET', '/tenant/notifications/unread-count', { token: ten });
  check('notifications unread-count', r.status === 200 && typeof r.json.data.count === 'number', r.json);

  // permission denial for Staff
  r = await call('POST', '/tenant/auth/login', { body: { tenant: 'demo', email: 'staff@demo.test', password: 'password123' } });
  const staff = r.json.data.access_token;
  r = await call('POST', '/tenant/users', { token: staff, body: { name: 'X', email: 'x@demo.test', password: 'password123', role_id: categoryId } });
  check('Staff users.create -> 403 FORBIDDEN', r.status === 403 && r.json.error.code === 'FORBIDDEN', r.json);
  r = await call('GET', '/tenant/orders', { token: staff });
  check('Staff orders.view allowed', r.status === 200, r.json);

  // ---- store
  console.log('Store');
  r = await call('GET', '/store/settings', { headers: store });
  check('store settings (no notifications, has tenant/store_url)', r.status === 200 && !r.json.data.notifications && r.json.data.tenant.slug === 'demo' && r.json.data.store_url, r.json);
  check('store settings reflect theme update (cache invalidated)', r.json.data.theme.primary_color === '#e11d48', r.json.data?.theme);
  r = await call('GET', '/store/settings', { headers: { 'X-Tenant': 'nope-not-here' } });
  check('unknown tenant -> TENANT_NOT_FOUND', r.status === 404 && r.json.error.code === 'TENANT_NOT_FOUND', r.json);
  r = await call('GET', '/store/settings', { headers: { 'X-Store-Domain': 'localhost:3001' } });
  check('resolve by X-Store-Domain', r.status === 200 && r.json.data.tenant.slug === 'demo', r.json);
  r = await call('GET', '/store/products?category=electronics&sort=price_asc&limit=50', { headers: store });
  check(
    'store products category tree filter + price_asc',
    r.status === 200 && r.json.data.length > 0 && r.json.data.every((p, i, a) => i === 0 || a[i - 1].price <= p.price) && r.json.data.some((p) => p.category.slug === 'audio'),
    r.json,
  );
  r = await call('GET', '/store/products?min_price=100&max_price=200&featured=true', { headers: store });
  check('store products price range + featured', r.status === 200 && r.json.data.every((p) => p.price >= 100 && p.price <= 200 && p.is_featured), r.json);
  r = await call('GET', '/store/products?brand=sonora&sort=popular', { headers: store });
  check('store products brand filter', r.status === 200 && r.json.data.length > 0 && r.json.data.every((p) => p.brand.slug === 'sonora'), r.json);
  r = await call('GET', '/store/products?limit=100', { headers: store });
  check('store products only active', r.status === 200 && r.json.meta.total === 22, r.json.meta);
  const target = r.json.data.find((p) => p.slug === 'voltix-65w-gan-charger');
  r = await call('GET', `/store/products/${target.slug}`, { headers: store });
  check('store product detail + related', r.status === 200 && r.json.data.description && Array.isArray(r.json.data.related) && r.json.data.attributes.length > 0, r.json);
  r = await call('GET', '/store/products/sonora-aria-wireless-headphones/reviews', { headers: store });
  check('store product reviews (approved)', r.status === 200 && r.json.meta.total > 0, r.json);
  r = await call('POST', '/store/products/sonora-aria-wireless-headphones/reviews', { headers: store, body: { rating: 5, title: 'Great', body: 'Love it', author_name: 'Smoke' } });
  check('store post review (pending)', r.status === 201 && r.json.data.status === 'pending', r.json);
  r = await call('GET', '/store/categories', { headers: store });
  const electronics = r.json.data.find((c) => c.slug === 'electronics');
  check('store categories tree', r.status === 200 && electronics && electronics.children.length === 2 && electronics.product_count > 0, r.json);
  r = await call('GET', '/store/categories/audio', { headers: store });
  check('store category breadcrumbs', r.status === 200 && r.json.data.breadcrumbs.map((b) => b.slug).join('/') === 'electronics/audio', r.json);
  r = await call('GET', '/store/brands', { headers: store });
  check('store brands', r.status === 200 && r.json.data.length === 5, r.json);
  r = await call('GET', '/store/search?q=sonora', { headers: store });
  check('store search', r.status === 200 && r.json.data.products.length > 0 && r.json.data.brands.length === 1, r.json);
  r = await call('GET', '/store/pages', { headers: store });
  check('store pages', r.status === 200 && r.json.data.length === 5 && 'show_in_footer' in r.json.data[0], r.json);
  r = await call('GET', '/store/sitemap', { headers: store });
  check('store sitemap', r.status === 200 && r.json.data.products.length === 22 && r.json.data.pages.length === 5, r.json);

  // cart flow
  r = await call('POST', '/store/cart', { headers: store });
  check('create cart', r.status === 201 && r.json.data.token && r.headers.get('x-cart-token') === r.json.data.token, r.json);
  const cartToken = r.json.data.token;
  const ch = { ...store, 'X-Cart-Token': cartToken };
  const before = (await call('GET', `/tenant/products/${target.id}`, { token: ten })).json.data.stock_quantity;
  r = await call('POST', '/store/cart/items', { headers: ch, body: { product_id: target.id, quantity: 1 } });
  check('add item', r.status === 200 && r.json.data.items.length === 1 && r.json.data.subtotal === target.price, r.json);
  const itemId = r.json.data.items[0].id;
  r = await call('POST', '/store/cart/coupon', { headers: ch, body: { code: 'WELCOME10' } });
  check('apply WELCOME10', r.status === 200 && r.json.data.coupon?.code === 'WELCOME10' && r.json.data.discount_total === Math.round(target.price * 10) / 100, r.json);
  r = await call('POST', '/store/cart/coupon', { headers: ch, body: { code: 'BOGUS' } });
  check('invalid coupon -> 422', r.status === 422 && r.json.error.details[0].path === 'code', r.json);
  r = await call('PATCH', `/store/cart/items/${itemId}`, { headers: ch, body: { quantity: 2 } });
  check('update qty', r.status === 200 && r.json.data.items[0].quantity === 2 && r.json.data.subtotal === target.price * 2, r.json);
  r = await call('PATCH', `/store/cart/items/${itemId}`, { headers: ch, body: { quantity: 100000 } });
  check('qty validation -> 422', r.status === 422, r.json);
  const cartTotals = (await call('GET', '/store/cart', { headers: ch })).json.data;
  r = await call('GET', `/store/checkout/shipping-methods?cart_token=${cartToken}`, { headers: store });
  check('shipping methods with cost', r.status === 200 && r.json.data.length === 3 && r.json.data.every((m) => typeof m.cost === 'number'), r.json);
  const standard = r.json.data.find((m) => m.type === 'free_over');
  r = await call('POST', '/store/checkout', {
    headers: store,
    body: {
      cart_token: cartToken,
      email: 'guest.buyer@example.com',
      phone: '+1 555 0199',
      shipping_address: { name: 'Guest Buyer', phone: '+1 555 0199', line1: '1 Test Way', city: 'Testville', state: 'CA', postal_code: '90001', country: 'US' },
      shipping_method_id: standard.id,
      payment_method: 'cod',
    },
  });
  check('checkout (COD)', r.status === 201 && r.json.data.order.order_number === '1026' && r.json.data.order.items.length === 1, r.json);
  const order = r.json.data.order;
  check('checkout totals match cart', order && order.subtotal === cartTotals.subtotal && order.discount_total === cartTotals.discount_total, { order, cartTotals });
  r = await call('GET', '/tenant/orders?search=1026', { token: ten });
  check('order visible in /tenant/orders', r.status === 200 && r.json.data.some((o) => o.order_number === '1026'), r.json);
  r = await call('GET', `/tenant/orders/${order?.id}`, { token: ten });
  check('tenant order detail', r.status === 200 && r.json.data.items.length === 1 && r.json.data.history.length === 1 && r.json.data.payments.length === 1, r.json);
  const after = (await call('GET', `/tenant/products/${target.id}`, { token: ten })).json.data.stock_quantity;
  check(`stock decremented (${before} -> ${after})`, after === before - 2);
  r = await call('GET', '/store/cart', { headers: ch });
  check('cart cleared after checkout (new empty cart)', r.status === 200 && r.json.data.items.length === 0 && r.json.data.token !== cartToken, r.json);
  r = await call('GET', `/store/orders/${order?.order_number}?email=guest.buyer@example.com`, { headers: store });
  check('guest order lookup by email', r.status === 200 && r.json.data.order_number === order?.order_number, r.json);
  r = await call('PUT', `/tenant/orders/${order?.id}/status`, { token: ten, body: { status: 'shipped', tracking_number: 'TRACK123' } });
  check('tenant update order status', r.status === 200 && r.json.data.status === 'shipped' && r.json.data.history.length === 2, r.json);

  // customers
  const email = `cust.${Date.now()}@example.com`;
  r = await call('POST', '/store/customers/register', { headers: store, body: { name: 'Casey Customer', email, password: 'password123' } });
  check('customer register', r.status === 201 && r.json.data.access_token && r.json.data.user.email === email, r.json);
  r = await call('POST', '/store/customers/register', { headers: store, body: { name: 'Casey Customer', email, password: 'password123' } });
  check('duplicate register -> 409', r.status === 409, r.json);
  r = await call('POST', '/store/customers/login', { headers: store, body: { email: 'jane@example.com', password: 'password123' } });
  check('customer login', r.status === 200 && r.json.data.access_token, r.json);
  const cust = r.json.data.access_token;
  r = await call('GET', '/store/customers/me', { headers: store, token: cust });
  check('customer me', r.status === 200 && r.json.data.email === 'jane@example.com' && !('password_hash' in r.json.data), r.json);
  r = await call('GET', '/store/orders', { headers: store, token: cust });
  check('customer orders', r.status === 200 && r.json.data.length > 0 && r.json.data[0].items.length > 0, r.json);
  r = await call('GET', '/store/orders', { headers: store });
  check('customer orders without token -> 401', r.status === 401, r.json);
  r = await call('PUT', '/store/customers/me', { headers: store, token: cust, body: { phone: '+1 555 7777' } });
  check('customer update me', r.status === 200 && r.json.data.phone === '+1 555 7777', r.json);
  r = await call('POST', '/store/customers/register', { headers: store, body: { name: '', email: 'bad', password: '1' } });
  check('register validation -> 422 details', r.status === 422 && r.json.error.details.length === 3, r.json);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
