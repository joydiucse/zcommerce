# Architecture

zCommerce is a multi-tenant SaaS e-commerce API: one Node.js process serves three scopes over a shared PostgreSQL database.

| Scope | Prefix | Callers | Token `aud` | Tenant comes from |
|---|---|---|---|---|
| System | `/api/v1/system` | Platform super-admins (`system_users`) | `system` | n/a |
| Tenant | `/api/v1/tenant` | Merchant staff (`users`) | `tenant` | JWT `tenant_id` |
| Store | `/api/v1/store` | Public shoppers and customers | `customer` (optional) | `X-Tenant` → `X-Store-Domain` → `Host`, host[:port] matched to `tenants.site_host` (no fallback) |

## Layout

```
src/
  app/
    config/        env + typed config objects (app, database, redis, jwt, storage, mail)
    database/      knex + ioredis connections, transaction helper, migrations/, seeders/
    middleware/    request-id, auth, system/tenant/store, permission, validation, rate-limit, error
    tenant/        AsyncLocalStorage context, slug/domain resolvers, tenant-scope (isolation)
    security/      jwt (access/refresh + rotation), password (bcrypt), encryption (AES-GCM), hash
    container.js   DI registry: repositories -> services -> controllers
  modules/
    system/<module>/   <name>.controller|service|repository|routes|validation.js
    tenant/<module>/   (reviews live in products/, pages + uploads in settings/, dashboard in reports/)
    store/<module>/    (settings + sitemap in storefront/)
  shared/          constants (permissions, settings defaults), enums, exceptions, helpers
                   (response, pagination, order-totals, crud), utils (logger, cache, mailer), validators
  jobs/            queues/ (BullMQ producers), processors/ (email, notification), workers/ (npm run worker)
  routes/          index.js mounts system/tenant/store routers under /api/v1
  app.js           express app factory (used by server.js and the tests)
  server.js        HTTP server + graceful shutdown
```

## Request pipeline

`request-id` → `pino-http` → `helmet` → `cors` → `compression` → body parsers → `/storage` static →
`/health` → `/api/v1` (general rate limiter) → scope router → module router → `error.middleware`.

Each module router composes `can('<permission>')`, `validate({ body, query, params })` and a controller method.
Controllers are thin: they call a service and wrap the result in the contract envelope
(`{ success, data, meta? }`). Services hold the business rules. Repositories are the only layer that touches Knex.

## Dependency injection

`src/app/container.js` registers each module explicitly with `module(prefix, { repository, service, controller })`.
The container is a lazy proxy: `new XService(container)` destructures what it needs
(`{ productRepository, settingService }`), and each dependency is built once on first access. Routers receive the
container and pick their controller (`({ productController: c }) => ...`). Tests can call
`createApp({ container })` with a custom container.

## Tenant isolation

* `tenant/tenant-context.js` stores the current tenant in `AsyncLocalStorage`. `tenant.middleware` (staff JWT) and
  `store.middleware` (public storefront) call `runWithTenant(tenant, next)`, so everything downstream can call
  `getTenantId()`.
* `tenant/tenant-scope.js` is the only place tenant filtering happens: `scoped(table)` adds
  `where <table>.tenant_id = ?`, `scopedInsert(table, data)` forces `tenant_id`, and `TenantRepository` (the base
  class for tenant-owned repositories) builds every query on top of them. Repositories never take a tenant id from
  user input.
* Cross-references (for example a product's `category_id`) are checked through scoped lookups, so a tenant cannot
  attach another tenant's rows.
* Tenant lookups are cached in Redis (`tenant:slug:<slug>`, `tenant:domain:<host>`, `tenant:id:<id>`, TTL 5 min) with an
  in-memory fallback, and are invalidated whenever a tenant changes (update, suspend, activate, delete, subscription change).
* Suspended tenants get `403 TENANT_SUSPENDED` on staff routes, store routes and login. Unknown stores get `404 TENANT_NOT_FOUND`.

## Auth

* Access JWT: 15 min, `{ sub, aud, tenant_id?, role_id?, type: "access" }`, with the audience checked per scope.
* Refresh JWT: 30 days with a `jti`. Its SHA-256 hash is stored at `refresh:<aud>:<jti>`. `/refresh` verifies the hash,
  deletes it and issues a new pair (rotation, so a reused token is rejected). `/logout` deletes it.
* Permissions are `<resource>.<action>` keys stored on the role (`*` = everything, `products.*` = a whole resource).
  Role permissions are cached at `perms:<scope>:<role_id>` for 60 s and invalidated on role update or delete.

## Money & totals

PG `NUMERIC` and `INT8` are parsed to JS numbers (`pg.types.setTypeParser`). `shared/helpers/order-totals.js` is the
single totals function (subtotal → coupon discount → shipping by method → tax) used by both the cart response and
checkout, so the numbers a shopper sees are the numbers that get charged.

## Checkout

One database transaction (`database/transaction.js`):
1. `SELECT ... FOR UPDATE` on the cart's product rows (sorted ids to avoid deadlocks), re-price from the locked rows and validate stock.
2. Validate the shipping method and lock and re-validate the coupon.
3. Find or create the customer (guests get a passwordless customer row).
4. Allocate the next per-tenant order number (transaction advisory lock, starting at 1001).
5. Insert the order, items, status history and payment row.
6. Decrement stock, write `inventory_movements` (`sale`) and create a `stock.low` notification if the threshold is crossed.
7. Increment coupon `used_count`, update customer `orders_count`/`total_spent`/`last_order_at`, and create the `order.placed` notification.

After commit the cart is deleted and `order.confirmation` / `order.admin` emails are enqueued.

## Background jobs

BullMQ queues `emails` and `notifications` (`jobs/queues`), processors in `jobs/processors`, worker entry
`jobs/workers/index.js`. `enqueue()` never throws. If Redis is down **or older than 5.0** (BullMQ's minimum), the job
runs inline in the API process (fire-and-forget) and a single warning is logged. The worker checks the Redis version on
boot and exits with a clear message instead of looping on errors.

Without `SMTP_HOST`, nodemailer uses the JSON transport and emails are only logged.

## Caching & rate limiting

* `shared/utils/cache.js` is a JSON cache on Redis with an in-process fallback, used for tenants, settings
  (`settings:<tenant_id>`, invalidated on `PUT /tenant/settings/:group`), permissions, carts and refresh tokens.
* `rate-limit.middleware.js` is a Redis fixed window: 600 req/min/IP on the API, 10 req/min on login endpoints
  (per IP + route + email), plus small limits on register, reviews and checkout. It fails open when Redis is unavailable.

## Errors

`shared/exceptions` defines `AppError` and its subclasses (`ValidationError`, `UnauthenticatedError`, `ForbiddenError`,
`NotFoundError`, `ConflictError`, `RateLimitedError`, `TenantNotFoundError`, `TenantSuspendedError`).
`error.middleware.js` maps those plus `ZodError` (422), multer errors (422), PG `23505` unique (409 `CONFLICT`),
`23503` FK (409 if the row is still referenced, 422 otherwise) and `22P02` invalid input (422) to the contract envelope.

## Logging

pino writes JSON to stdout and `logs/app.log`. Each request gets an `X-Request-Id` (an incoming one is reused when it
is valid) that is echoed in responses and logs. Authorization headers and password fields are redacted.
