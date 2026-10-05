# zcommerce-backend

Multi-tenant SaaS e-commerce API (Node.js 22, Express 5, Knex + PostgreSQL, ioredis + BullMQ, Zod, JWT).
It serves the admin panel (`zcommerce-admin`, port 5173) and the storefront (`zcommerce-store`, port 3000) according to
[`../CONTRACT.md`](../CONTRACT.md).

* [docs/architecture.md](docs/architecture.md): layers, tenant isolation, auth, checkout, jobs
* [docs/database.md](docs/database.md): schema, Redis keys, seed data
* [docs/api.md](docs/api.md): endpoint map and behaviour notes

## Requirements

* Node.js ≥ 22, npm 10
* PostgreSQL ≥ 14 (with `gen_random_uuid()`) and an empty `zcommerce` database
* Redis. Version 5.0 or newer is needed for BullMQ background jobs. With an older or unreachable Redis the API still
  works: jobs run inline, rate limiting fails open, and the cache falls back to memory.

## Setup

```bash
cp .env.example .env          # then set DATABASE_URL, REDIS_URL and generate secrets
npm install
npm run migrate
npm run seed                  # demo data (safe to re-run; it truncates first)
npm run dev                   # http://localhost:4000 (nodemon)
npm run worker                # optional: BullMQ worker for emails/notifications (needs Redis >= 5)
```

Generate secrets with:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### Demo accounts (password `password123`)

| Scope | Login |
|---|---|
| System | `admin@zcommerce.test` |
| Tenant (store `demo`) | `owner@demo.test` (Owner), `manager@demo.test` (Manager), `staff@demo.test` (Staff) |
| Store customer | `jane@example.com` |

Coupons: `WELCOME10` (10% off), `FREESHIP` (free shipping over $25).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `npm start` | API with nodemon / plain node |
| `npm run worker` | BullMQ workers (`emails`, `notifications`) |
| `npm run migrate` / `migrate:rollback` | Knex migrations |
| `npm run seed` | Truncate and reseed demo data |
| `npm run db:reset` | Roll back all migrations, migrate, seed |
| `npm test` | Vitest unit and integration tests (integration needs the seeded DB) |
| `npm run smoke` | End-to-end smoke test against a running server |
| `npm run lint` | Syntax-check every source file |

## Environment

| Variable | Default | Notes |
|---|---|---|
| `PORT` | 4000 | |
| `APP_URL` | `http://localhost:4000` | used for absolute upload URLs |
| `DATABASE_URL` | `postgres://postgres:@127.0.0.1:5432/zcommerce` | |
| `REDIS_URL` | `redis://127.0.0.1:6379` | |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | n/a | required in production |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | 900, 2592000 | seconds |
| `ENCRYPTION_KEY` | n/a | AES-256-GCM key material |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3001` | comma separated, `*` allowed |
| `PLATFORM_NAME` / `PLATFORM_TAGLINE` / `ADMIN_URL` / `SUPPORT_EMAIL` | zCommerce / … | platform details served by `GET /store/platform` (shown by the storefront on hosts with no store) |
| `STOREFRONT_URL` | `http://localhost:3001` | fallback `store_url` in `/store/settings`; target of the revalidate webhook |
| `REVALIDATE_SECRET` | _(empty = disabled)_ | after admin writes to settings/products/categories/brands/reviews/pages/inventory, the API POSTs cache tags to `STOREFRONT_URL/api/revalidate` so the store updates instantly |
| `UPLOAD_MAX_MB` | 5 | |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | n/a | without `SMTP_HOST`, emails are logged only (JSON transport) |

## Docker

```bash
docker compose up --build          # api (runs migrations on boot), worker, postgres:16, redis:7
docker compose exec api npx knex --knexfile knexfile.js seed:run
```

## Project layout

```
src/app          config, database (connection, transaction, migrations, seeders), middleware, tenant, security, container
src/modules      system/*, tenant/*, store/*: controller, service, repository, routes, validation per module
src/shared       constants, enums, exceptions, helpers, utils, validators, types
src/jobs         queues, processors, workers
src/routes       index + system/tenant/store routers
tests            unit, integration, e2e
storage/uploads  uploaded images (served at /storage)
logs             pino log files
```
