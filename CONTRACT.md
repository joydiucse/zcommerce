# zCommerce — Shared Contract

Multi-tenant SaaS e-commerce platform. Three apps live side by side:

| App | Stack | Port | Folder |
|---|---|---|---|
| Backend API | Node.js 22 (ESM), Express, Knex + PostgreSQL, ioredis + BullMQ, Zod, JWT | 4000 | `zcommerce-backend/` |
| Admin panel | Vite + React 19 + TypeScript, Tailwind CSS, shadcn/ui, TanStack Table + TanStack Query, react-icons, react-router | 5173 | `zcommerce-admin/` |
| Storefront | Next.js (App Router, TS), Tailwind CSS, full SEO | 3001 | `zcommerce-store/` |

This file is the source of truth. All three apps MUST follow it exactly (paths, field names, shapes).

---

## 1. Conventions

- Base URL: `http://localhost:4000/api/v1`
- JSON keys: **snake_case** everywhere (request + response).
- IDs: UUID strings. Money: JSON **numbers** (backend converts PG numeric to Number), 2 decimals.
- Timestamps: ISO-8601 strings (`created_at`, `updated_at`).
- Success envelope: `{ "success": true, "data": <any>, "meta"?: {...} }`
- Error envelope: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details"?: [{ "path": "email", "message": "..." }] } }`
  - Codes: `VALIDATION_ERROR`(422) `UNAUTHENTICATED`(401) `FORBIDDEN`(403) `NOT_FOUND`(404) `CONFLICT`(409) `RATE_LIMITED`(429) `TENANT_NOT_FOUND`(404) `TENANT_SUSPENDED`(403) `INTERNAL_ERROR`(500)
- List endpoints accept `?page=1&limit=20&search=&sort=created_at&order=desc` plus resource-specific filters, and return
  `meta: { page, limit, total, total_pages }`. `limit` max 100.
- Every response carries `X-Request-Id`.
- Static uploads served by backend at `http://localhost:4000/storage/<path>`; upload endpoints return absolute URLs.

## 2. Scopes & auth

Three scopes, three token audiences (JWT `aud`): `system`, `tenant`, `customer`.

| Scope | Prefix | Who | Tenant resolution |
|---|---|---|---|
| System | `/system/*` | Platform super-admins (`system_users`) | none |
| Tenant | `/tenant/*` | Merchant staff (`users` with `tenant_id`) | from JWT `tenant_id` |
| Store | `/store/*` | Public shoppers & customers | header `X-Tenant: <slug>`, else header `X-Store-Domain: <host>`, else request `Host` matched to `tenants.custom_domain` |

- Access token: JWT, 15 min, `Authorization: Bearer <token>`. Payload: `{ sub, aud, tenant_id?, role_id?, type: "access" }`.
- Refresh token: JWT 30 days, stored hashed in Redis (`refresh:<aud>:<jti>`) so logout/rotation revokes it.
- Login response (all scopes): `{ access_token, refresh_token, expires_in, user }`.
- Refresh: `POST .../auth/refresh { refresh_token }` → same shape (rotated).
- Permissions: string keys `<resource>.<action>`. Role with `"*"` = all. Tenant owner role is `*`.
  System super-admin role is `*`.

### Tenant permission keys
```
dashboard.view
products.view products.create products.update products.delete
categories.view categories.create categories.update categories.delete
brands.view brands.create brands.update brands.delete
customers.view customers.create customers.update customers.delete
orders.view orders.update
payments.view payments.update
inventory.view inventory.update
shipping.view shipping.create shipping.update shipping.delete
coupons.view coupons.create coupons.update coupons.delete
reviews.view reviews.update reviews.delete
pages.view pages.create pages.update pages.delete
reports.view
notifications.view
settings.view settings.update
users.view users.create users.update users.delete
roles.view roles.create roles.update roles.delete
```
### System permission keys
```
dashboard.view tenants.view tenants.create tenants.update tenants.delete
plans.view plans.create plans.update plans.delete
subscriptions.view subscriptions.create subscriptions.update
billing.view billing.update
users.view users.create users.update users.delete
roles.view roles.create roles.update roles.delete
audit_logs.view
```

## 3. Database (PostgreSQL, Knex migrations)

All tenant-owned tables have `tenant_id uuid not null references tenants on delete cascade` and are indexed on it.
Every table has `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at` (timestamptz).
Slugs are unique per tenant `(tenant_id, slug)`.

**System side**
- `system_roles` (name, description, permissions jsonb array, is_system bool)
- `system_users` (name, email unique, password_hash, role_id → system_roles, status active|disabled, last_login_at)
- `plans` (name, slug unique, description, price_monthly, price_yearly, currency, limits jsonb `{products, staff, storage_mb}`, features jsonb array of strings, is_active, sort_order)
- `tenants` (name, slug unique, custom_domain unique nullable, email, phone, status trial|active|suspended, plan_id → plans nullable, trial_ends_at, owner_id nullable)
- `subscriptions` (tenant_id, plan_id, status trialing|active|past_due|canceled, billing_cycle monthly|yearly, amount, current_period_start, current_period_end, canceled_at)
- `invoices` (tenant_id, subscription_id nullable, number unique e.g. `INV-000001`, amount, currency, status draft|open|paid|void, due_date, paid_at, items jsonb)
- `audit_logs` (actor_type system|tenant, actor_id, tenant_id nullable, action e.g. `tenant.created`, entity_type, entity_id, changes jsonb, ip, user_agent)

**Tenant side**
- `roles` (tenant_id, name, description, permissions jsonb array, is_system bool)
- `users` (tenant_id, name, email — unique per tenant, password_hash, role_id → roles, status active|disabled, avatar_url, last_login_at)
- `categories` (tenant_id, parent_id nullable self-ref, name, slug, description, image_url, is_active, sort_order, meta_title, meta_description)
- `brands` (tenant_id, name, slug, description, logo_url, is_active, meta_title, meta_description)
- `products` (tenant_id, category_id nullable, brand_id nullable, name, slug, sku, short_description, description (HTML), price, compare_at_price nullable, cost_price nullable, status draft|active|archived, is_featured, track_inventory bool, stock_quantity int, low_stock_threshold int default 5, weight numeric nullable, images jsonb `[{url, alt}]`, attributes jsonb `[{name, value}]`, tags jsonb array, meta_title, meta_description, rating_avg numeric default 0, rating_count int default 0, published_at)
- `inventory_movements` (tenant_id, product_id, type adjustment|sale|return|restock, quantity int (signed), reason, reference, created_by)
- `customers` (tenant_id, name, email — unique per tenant, phone, password_hash nullable (guest), status active|disabled, accepts_marketing bool, addresses jsonb array, orders_count int, total_spent numeric, last_order_at)
- `shipping_methods` (tenant_id, name, description, type flat|free|free_over, rate numeric, free_over_amount nullable, estimated_days text, is_active, sort_order)
- `coupons` (tenant_id, code — unique per tenant uppercase, type percent|fixed|free_shipping, value numeric, min_order_amount nullable, max_discount nullable, usage_limit nullable, used_count int, starts_at nullable, ends_at nullable, is_active)
- `orders` (tenant_id, customer_id nullable, order_number — unique per tenant e.g. `1001`, email, phone, status pending|confirmed|processing|shipped|delivered|cancelled|refunded, payment_status pending|paid|failed|refunded, fulfillment_status unfulfilled|fulfilled, currency, subtotal, discount_total, shipping_total, tax_total, grand_total, coupon_code nullable, shipping_method_id nullable, shipping_method_name, shipping_address jsonb, billing_address jsonb, payment_method cod|manual, notes, tracking_number nullable, placed_at, cancelled_at)
- `order_items` (tenant_id, order_id, product_id nullable, name, sku, image_url, unit_price, quantity, line_total)
- `order_status_history` (tenant_id, order_id, status, note, created_by nullable)
- `payments` (tenant_id, order_id, method cod|manual, amount, currency, status pending|paid|failed|refunded, transaction_ref nullable, paid_at)
- `reviews` (tenant_id, product_id, customer_id nullable, author_name, rating 1-5, title, body, status pending|approved|rejected)
- `pages` (tenant_id, title, slug, content (HTML), is_published, show_in_footer bool, meta_title, meta_description)
- `notifications` (tenant_id, user_id nullable (null = all staff), type e.g. order.placed|stock.low, title, body, data jsonb, read_at nullable)
- `tenant_settings` (tenant_id, group text, value jsonb) unique (tenant_id, group)

Address object: `{ name, phone, line1, line2, city, state, postal_code, country }`

Carts live in **Redis**: key `cart:<tenant_id>:<token>` JSON, TTL 30 days.
Redis also: settings cache `settings:<tenant_id>` (invalidated on update), tenant lookup cache `tenant:slug:<slug>` / `tenant:domain:<host>`, rate limit counters, refresh tokens, BullMQ queues (`emails`, `notifications`).

## 4. Settings (tenant_settings groups) — drives the storefront

`GET /tenant/settings` → `{ general, theme, seo, social, homepage, navigation, checkout, notifications }`
`PUT /tenant/settings/:group` body = full object for that group → returns updated group.
`GET /store/settings` → same object **without** `notifications`, merged with defaults, plus `tenant: { name, slug }` and `store_url`.

```jsonc
general: {
  store_name: "Demo Store", tagline: "", logo_url: null, favicon_url: null,
  contact_email: "", contact_phone: "", address: "",
  currency: "USD", currency_symbol: "$", locale: "en-US", timezone: "UTC"
}
theme: {
  primary_color: "#4f46e5", secondary_color: "#0f172a", accent_color: "#f59e0b",
  font_family: "Inter", border_radius: "md", // none|sm|md|lg|full
  footer_text: "© 2026 Demo Store. All rights reserved."
}
seo: {
  meta_title: "Demo Store", title_template: "%s | Demo Store",
  meta_description: "", meta_keywords: "", og_image_url: null,
  twitter_handle: "", canonical_url: "", robots_index: true,
  google_site_verification: "", bing_site_verification: "",
  google_analytics_id: "", gtm_id: "", facebook_pixel_id: "",
  organization_schema: true
}
social: { facebook: "", instagram: "", twitter: "", youtube: "", tiktok: "", linkedin: "" }
homepage: {
  announcement_bar: { enabled: true, text: "Free shipping over $50", link: "" },
  hero_slides: [ { image_url, title, subtitle, cta_text, cta_link } ],
  featured_category_ids: [],
  sections: { featured_products: true, new_arrivals: true, categories: true, brands: true, newsletter: true },
  products_per_section: 8
}
navigation: {
  header_menu: [ { label: "Shop", url: "/products" } ],
  footer_menus: [ { title: "Help", links: [ { label: "Contact", url: "/pages/contact" } ] } ]
}
checkout: {
  guest_checkout: true, tax_rate: 0, tax_inclusive: false, min_order_amount: 0,
  cod_enabled: true, manual_payment_enabled: true, manual_payment_instructions: "",
  terms_page_slug: "terms"
}
notifications: { admin_order_email: "", low_stock_alerts: true, customer_order_emails: true }
```

## 5. Endpoints

`CRUD /x` means: `GET /x` (list, paginated) · `POST /x` · `GET /x/:id` · `PUT /x/:id` · `DELETE /x/:id`.

### Health
- `GET /health` → `{ status: "ok", db: "up", redis: "up" }` (no `/api/v1` prefix also served at `/health`)

### System (`/system`)
- `POST /auth/login {email, password}` · `POST /auth/refresh` · `POST /auth/logout {refresh_token}` · `GET /auth/me` → `{ user: {id,name,email,role:{id,name}}, permissions: [] }`
- `GET /dashboard` → `{ tenants_total, tenants_active, tenants_trial, mrr, invoices_open_amount, recent_tenants: [...], tenants_by_month: [{month, count}] }`
- `CRUD /tenants` — filters `status`, `plan_id`. Create body: `{ name, slug, email, phone?, plan_id?, custom_domain?, owner: { name, email, password } }` → creates tenant, default Owner/Manager/Staff roles, owner user, default settings, trial subscription. Extra: `POST /tenants/:id/suspend`, `POST /tenants/:id/activate`.
- `CRUD /plans`
- `GET /subscriptions` (filters `status`, `tenant_id`) · `POST /subscriptions` · `GET /subscriptions/:id` · `PUT /subscriptions/:id` · `POST /subscriptions/:id/cancel`
- `GET /billing/invoices` (filters `status`, `tenant_id`) · `POST /billing/invoices` · `GET /billing/invoices/:id` · `POST /billing/invoices/:id/mark-paid` · `POST /billing/invoices/:id/void`
- `CRUD /users` (system users)
- `CRUD /roles` · `GET /permissions` → `[{ group: "tenants", keys: ["tenants.view", ...] }]`
- `GET /audit-logs` (filters `actor_type`, `tenant_id`, `action`, `from`, `to`)

### Tenant (`/tenant`)
- `POST /auth/login { tenant, email, password }` (`tenant` = slug) · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` → `{ user, tenant: {id,name,slug,status,custom_domain}, permissions: [] }` · `PUT /auth/profile {name, avatar_url}` · `PUT /auth/password {current_password, password}`
- `GET /dashboard` → `{ revenue_today, revenue_month, orders_today, orders_month, customers_total, products_total, low_stock_count, pending_orders, sales_chart: [{date, revenue, orders}] (last 30 days), top_products: [{id,name,quantity,revenue}], recent_orders: [...] }`
- `CRUD /users` · `CRUD /roles` · `GET /permissions` (grouped like system)
- `CRUD /products` — filters `status`, `category_id`, `brand_id`, `is_featured`, `stock` (in|low|out). Response includes `category:{id,name}`, `brand:{id,name}`. Extra: `POST /products/bulk { ids, action: "delete"|"activate"|"archive" }`
- `CRUD /categories` (filter `parent_id`; `GET /categories?all=true` returns unpaginated flat list for selects) · `CRUD /brands` (same `all=true`)
- `CRUD /customers` (detail includes `recent_orders`)
- `GET /orders` (filters `status`, `payment_status`, `from`, `to`) · `GET /orders/:id` (includes `items`, `history`, `payments`, `customer`) · `PUT /orders/:id/status { status, note?, tracking_number? }` · `PUT /orders/:id/payment-status { payment_status }`
- `GET /payments` (filters `status`, `method`)
- `GET /inventory` (product list w/ stock, filter `stock`) · `POST /inventory/adjust { product_id, quantity (signed), type, reason }` · `GET /inventory/movements?product_id=`
- `CRUD /shipping/methods`
- `CRUD /coupons`
- `GET /reviews` (filters `status`, `product_id`) · `PUT /reviews/:id { status }` · `DELETE /reviews/:id`
- `CRUD /pages`
- `GET /reports/sales?from&to&group_by=day|week|month` → `{ summary: {revenue, orders, average_order_value, items_sold}, series: [{period, revenue, orders}] }` · `GET /reports/products?from&to` → top sellers · `GET /reports/customers?from&to` → top customers
- `GET /notifications` (filter `unread=true`) · `GET /notifications/unread-count` → `{ count }` · `POST /notifications/:id/read` · `POST /notifications/read-all`
- `GET /settings` · `PUT /settings/:group`
- `POST /uploads` (multipart field `file`, images ≤ 5MB) → `{ url, path, size, mime }`

### Store (`/store`) — public, tenant from `X-Tenant` / `X-Store-Domain` / Host
- `GET /settings` (see §4)
- `GET /products` — filters `category` (slug), `brand` (slug), `min_price`, `max_price`, `featured=true`, `sort` = `newest|price_asc|price_desc|name|popular`, `page`, `limit`, `search`. Only `status=active`.
- `GET /products/:slug` → product + `related: [...]` (4 same-category)
- `GET /products/:slug/reviews` (approved, paginated) · `POST /products/:slug/reviews { rating, title, body, author_name? }` (customer token optional; saved `pending`)
- `GET /categories` → tree `[{ id, name, slug, image_url, product_count, children: [...] }]` · `GET /categories/:slug` → category + `breadcrumbs: [{name, slug}]`
- `GET /brands` · `GET /brands/:slug`
- `GET /search?q=&limit=` → `{ products: [...], categories: [...], brands: [...] }`
- `GET /pages` (published, `{title, slug, show_in_footer}`) · `GET /pages/:slug`
- `GET /sitemap` → `{ products: [{slug, updated_at}], categories: [...], brands: [...], pages: [...] }`
- Cart (header `X-Cart-Token`): `POST /cart` → new cart · `GET /cart` · `POST /cart/items { product_id, quantity }` · `PATCH /cart/items/:item_id { quantity }` · `DELETE /cart/items/:item_id` · `POST /cart/coupon { code }` · `DELETE /cart/coupon`. If token missing/expired on any write, backend creates a new cart and returns its token.
- `GET /checkout/shipping-methods?cart_token=` → active methods with computed `cost` for the cart
- `POST /checkout { cart_token, email, phone, shipping_address, billing_address?, shipping_method_id, payment_method: "cod"|"manual", notes? }` (customer token optional) → `{ order }`; validates stock, decrements inventory, increments coupon usage, clears cart, enqueues email + creates tenant notification.
- `POST /customers/register { name, email, password, phone? }` · `POST /customers/login { email, password }` · `POST /customers/refresh` · `GET /customers/me` · `PUT /customers/me { name, phone, addresses }`
- `GET /orders` (customer token) · `GET /orders/:order_number` (customer token, or `?email=` for guests)

#### Store shapes
```jsonc
// product (list item)
{ id, name, slug, sku, short_description, price, compare_at_price, images: [{url, alt}],
  category: {id, name, slug} | null, brand: {id, name, slug} | null,
  in_stock, stock_quantity, is_featured, rating_avg, rating_count, updated_at }
// product (detail) adds: description, attributes, tags, meta_title, meta_description, related
// cart
{ token, items: [{ id, product_id, name, slug, sku, image_url, price, quantity, line_total, in_stock, max_quantity }],
  item_count, subtotal, discount_total, shipping_total, tax_total, grand_total,
  coupon: { code, type, value } | null, currency }
// order
{ id, order_number, status, payment_status, email, phone, currency, subtotal, discount_total, shipping_total,
  tax_total, grand_total, coupon_code, shipping_method_name, shipping_address, billing_address,
  payment_method, notes, tracking_number, items: [{name, sku, image_url, unit_price, quantity, line_total}],
  placed_at, created_at }
```

## 6. Seed data (`npm run seed`)
- System admin: `admin@zcommerce.test` / `password123` (role Super Admin `*`)
- Plans: Starter ($19), Growth ($49), Pro ($99)
- Tenant `demo` (name "Demo Store", custom_domain `localhost`), owner `owner@demo.test` / `password123`, active Growth subscription + 2 invoices
- Roles Owner(`*`)/Manager/Staff; 6 categories (2 nested), 5 brands, ~24 products with `https://picsum.photos/seed/<slug>/800/800` images, 3 shipping methods, coupons `WELCOME10` (10%) + `FREESHIP`, pages about/contact/terms/privacy/shipping-returns, ~10 customers, ~25 orders over the last 30 days, approved reviews, full default settings with 3 hero slides.

## 7. Environment
Backend `.env`: `PORT=4000`, `DATABASE_URL=postgres://postgres:@127.0.0.1:5432/zcommerce`, `REDIS_URL=redis://127.0.0.1:6379`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `APP_URL=http://localhost:4000`, `CORS_ORIGINS=http://localhost:5173,http://localhost:3001`, `ENCRYPTION_KEY`, SMTP_*.
Admin `.env`: `VITE_API_URL=http://localhost:4000/api/v1`.
Store `.env`: `API_URL=http://localhost:4000/api/v1`, `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`, `STORE_TENANT=demo` (fallback when host not mapped), `NEXT_PUBLIC_SITE_URL=http://localhost:3001`, `REVALIDATE_SECONDS=60`.
