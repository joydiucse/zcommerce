# Database

PostgreSQL 14+ (uses the built-in `gen_random_uuid()`). Migrations: `src/app/database/migrations`. Seeds:
`src/app/database/seeders`. Knex config: `knexfile.js` → `src/app/config/database.config.js`.

```bash
npm run migrate            # latest
npm run migrate:rollback   # last batch
npm run seed               # truncate + demo data (idempotent)
npm run db:reset           # rollback all + migrate + seed
```

## Conventions

* `id uuid primary key default gen_random_uuid()`, plus `created_at` / `updated_at` as `timestamptz` (default `now()`).
* Tenant-owned tables have `tenant_id uuid not null references tenants on delete cascade` and an index on it.
* Slugs, emails and coupon codes are unique **per tenant**: `unique (tenant_id, slug)` and so on.
* Money is `numeric(12,2)` and is returned as a JS number.
* JSON data is `jsonb`: product `images`/`attributes`/`tags`, role `permissions`, customer `addresses`, order addresses,
  settings `value`, invoice `items`, notification `data`, audit `changes`.

## System tables

| Table | Notes |
|---|---|
| `system_roles` | `permissions` jsonb array, `is_system` |
| `system_users` | unique `email`, `role_id → system_roles` (restrict), `status active\|disabled` |
| `plans` | unique `slug`, `price_monthly`, `price_yearly`, `limits {products, staff, storage_mb}`, `features[]` |
| `tenants` | unique `slug`, unique nullable `custom_domain`, `status trial\|active\|suspended`, `plan_id`, `owner_id → users` (set null) |
| `subscriptions` | `tenant_id`, `plan_id`, `status trialing\|active\|past_due\|canceled`, `billing_cycle`, `amount`, period dates |
| `invoices` | unique `number` (`INV-000001`, from sequence `invoice_number_seq`), `status draft\|open\|paid\|void`, `items` jsonb |
| `audit_logs` | `actor_type system\|tenant`, `actor_id`, `tenant_id`, `action` (e.g. `tenant.suspended`), `entity_*`, `changes`, `ip`, `user_agent` |

## Tenant tables

| Table | Notes |
|---|---|
| `roles` | unique `(tenant_id, name)`; default Owner (`*`) / Manager / Staff created with each tenant |
| `users` | unique `(tenant_id, email)`, `role_id → roles` (restrict) |
| `categories` | self-referencing `parent_id` (set null), unique `(tenant_id, slug)` |
| `brands` | unique `(tenant_id, slug)` |
| `products` | `category_id`/`brand_id` (set null), `status draft\|active\|archived`, `track_inventory`, `stock_quantity`, `low_stock_threshold`, `rating_avg`/`rating_count` (kept in sync with approved reviews) |
| `inventory_movements` | signed `quantity`, `type adjustment\|sale\|return\|restock`, `reference` (order number) |
| `customers` | unique `(tenant_id, email)`, nullable `password_hash` (guest), `addresses` jsonb, `orders_count`, `total_spent`, `last_order_at` |
| `shipping_methods` | `type flat\|free\|free_over`, `rate`, `free_over_amount` |
| `coupons` | unique `(tenant_id, code)` (stored uppercase), `type percent\|fixed\|free_shipping`, limits and dates, `used_count` |
| `orders` | unique `(tenant_id, order_number)` (text, numeric per tenant from 1001), statuses, totals, addresses, `placed_at` |
| `order_items` | snapshot of product name/sku/image/price, `product_id` set null on product delete |
| `order_status_history` | one row per status change (`created_by` = staff user or null for the storefront) |
| `payments` | one row per order (`cod`/`manual`), kept in sync with `orders.payment_status` |
| `reviews` | `rating` check 1-5, `status pending\|approved\|rejected` |
| `pages` | CMS pages, unique `(tenant_id, slug)`, `is_published`, `show_in_footer` |
| `notifications` | `user_id` null = all staff, `type` (`order.placed`, `stock.low`, `review.created`), `read_at` |
| `tenant_settings` | unique `(tenant_id, group)`, `value` jsonb, deep-merged over defaults in `shared/constants/settings.js` |

## Redis keys

| Key | Purpose |
|---|---|
| `cart:<tenant_id>:<token>` | cart JSON, TTL 30 days |
| `settings:<tenant_id>` | public storefront settings cache |
| `tenant:slug:<slug>` / `tenant:domain:<host>` / `tenant:id:<id>` | tenant lookup cache |
| `perms:<scope>:<role_id>` | role permission cache (60 s) |
| `refresh:<aud>:<jti>` | hashed refresh token |
| `rl:<bucket>:<key>:<window>` | rate-limit counters |
| `bull:emails:*`, `bull:notifications:*` | BullMQ queues (Redis ≥ 5) |

## Seed data

`npm run seed` truncates every table, flushes the cache keys above and creates:

* System admin `admin@zcommerce.test` / `password123` (Super Admin `*`), plus `support@zcommerce.test` (read-only role).
* Plans Starter $19, Growth $49, Pro $99.
* Tenant **demo** ("Demo Store", `custom_domain = localhost`) on an active Growth subscription with 2 invoices
  (1 paid, 1 open). Staff: `owner@demo.test` (Owner), `manager@demo.test` (Manager) and `staff@demo.test` (Staff), all
  with password `password123`.
* 5 extra tenants (active, trial and suspended) so the platform dashboard has data.
* 6 categories (Audio and Wearables nested under Electronics), 5 brands, and 24 products (22 active, 1 draft,
  1 archived; some low or out of stock) with picsum images, HTML descriptions, attributes and tags.
* 3 shipping methods (Standard: free over $50, otherwise $5.99; Express $14.99 flat; Store Pickup free), coupons
  `WELCOME10` (10%, max $50) and `FREESHIP` (free shipping, min $25).
* Pages about, contact, terms, privacy and shipping-returns.
* 10 customers (the first 6 have password `password123`, for example `jane@example.com`; the rest are guests).
* 25 orders over the last 30 days (numbers 1001-1025) with varied statuses, history, payments and inventory movements.
* About 40 approved reviews, plus 2 pending ones.
* Full settings, including 3 hero slides.
