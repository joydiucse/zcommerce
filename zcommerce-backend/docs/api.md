# API

The binding specification is **[../../CONTRACT.md](../../CONTRACT.md)** (endpoints, field names, envelopes). This page
summarises the implementation and lists the small additions this backend makes on top of the contract. Additions are
extra fields or endpoints only; nothing in the contract is renamed or removed.

Base URL: `http://localhost:4000/api/v1`. All keys are snake_case. IDs are UUIDs. Money is a JSON number.

## Envelopes

```jsonc
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 57, "total_pages": 3 } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed",
  "details": [{ "path": "email", "message": "Invalid email" }] } }
```

* Validation detail paths are the field name for body fields and are prefixed with `query.` / `params.` for query
  string and URL parameters (e.g. `query.sort`).
* List endpoints accept `page`, `limit` (max 100), `search`, `sort`, `order`. Unknown `sort` values fall back to the
  default (`created_at desc` unless noted). Each resource has its own whitelist of sort columns.
* Every response has `X-Request-Id`. Cart responses also set `X-Cart-Token`.

## Auth headers

* System and tenant routes: `Authorization: Bearer <access_token>` (aud `system` / `tenant`).
* Store: `X-Tenant: <slug>` (or `X-Store-Domain` / `Host`), plus an optional `Authorization: Bearer <customer token>`.
* Login responses: `{ access_token, refresh_token, expires_in, user }`. The tenant login also includes `tenant`.

## Endpoint map

### Health
`GET /health` and `GET /api/v1/health` → `{ success, status, db, redis, data: { status, db, redis, uptime } }`.
The contract fields are at the top level and also inside `data`.

### System `/system`
| Method | Path | Permission |
|---|---|---|
| POST | `/auth/login`, `/auth/refresh`, `/auth/logout` | public |
| GET | `/auth/me` | any system user |
| GET | `/dashboard` | `dashboard.view` |
| CRUD | `/tenants` (+ `POST /:id/suspend`, `POST /:id/activate`) | `tenants.*` |
| CRUD | `/plans` (`?all=true` for an unpaginated list) | `plans.*` |
| GET/POST/GET/PUT | `/subscriptions` (+ `POST /:id/cancel`) | `subscriptions.*` |
| GET/POST/GET | `/billing/invoices` (+ `POST /:id/mark-paid`, `POST /:id/void`) | `billing.*` |
| CRUD | `/users`, `/roles` | `users.*`, `roles.*` |
| GET | `/permissions` | `roles.view` |
| GET | `/audit-logs` (`actor_type`, `tenant_id`, `action` prefix, `from`, `to`) | `audit_logs.view` |

### Tenant `/tenant`
| Method | Path | Permission |
|---|---|---|
| POST | `/auth/login {tenant, email, password}`, `/auth/refresh`, `/auth/logout` | public |
| GET/PUT/PUT | `/auth/me`, `/auth/profile`, `/auth/password` | any staff |
| GET | `/dashboard` | `dashboard.view` |
| CRUD | `/users`, `/roles`; GET `/permissions` | `users.*`, `roles.*` |
| CRUD | `/products` (+ `POST /bulk`) | `products.*` |
| CRUD | `/categories`, `/brands` (`?all=true`) | `categories.*`, `brands.*` |
| CRUD | `/customers` | `customers.*` |
| GET | `/orders`, `/orders/:id`; PUT `/orders/:id/status`, `/orders/:id/payment-status` | `orders.*` (payment-status: `payments.update` or `orders.update`) |
| GET | `/payments` | `payments.view` |
| GET/POST/GET | `/inventory`, `/inventory/adjust`, `/inventory/movements` | `inventory.*` |
| CRUD | `/shipping/methods` | `shipping.*` |
| CRUD | `/coupons` | `coupons.*` |
| GET/PUT/DELETE | `/reviews`, `/reviews/:id` | `reviews.*` |
| CRUD | `/pages` | `pages.*` |
| GET | `/reports/sales`, `/reports/products`, `/reports/customers` | `reports.view` |
| GET/GET/POST/POST | `/notifications`, `/notifications/unread-count`, `/notifications/:id/read`, `/notifications/read-all` | `notifications.view` |
| GET/PUT | `/settings`, `/settings/:group` | `settings.*` |
| POST | `/uploads` (multipart `file`, image ≤ 5 MB) | any catalog/content/settings write permission |

### Store `/store`
`GET /settings`, `GET /sitemap`, `GET /products`, `GET /products/:slug`, `GET|POST /products/:slug/reviews`,
`GET /categories`, `GET /categories/:slug`, `GET /brands`, `GET /brands/:slug`, `GET /search`, `GET /pages`,
`GET /pages/:slug`, cart (`POST /cart`, `GET /cart`, `POST /cart/items`, `PATCH|DELETE /cart/items/:item_id`,
`POST|DELETE /cart/coupon`), `GET /checkout/shipping-methods`, `POST /checkout`,
`POST /customers/register|login|refresh`, `GET|PUT /customers/me`, `GET /orders`, `GET /orders/:order_number`.

## Behaviour notes and additions

* **Order numbers** are strings (`"1001"`) and increase per tenant.
* **Store product** list items also include `published_at`. The detail view also includes `weight`.
* **Store `GET /products`**: `category=<slug>` includes products from child categories. `in_stock=true` is an extra
  filter. `sort=popular` orders by review count.
* **Store categories**: `product_count` includes descendants. `GET /categories/:slug` also returns `children`.
* **Cart**: the cart token comes from the `X-Cart-Token` header (or `cart_token` in the query or body). Write calls with
  a missing or expired token create a new cart. `GET /cart` with an unknown token also returns a new empty cart. Adding
  more than the available stock returns 422 (`details[0].path = "quantity"`). An invalid coupon returns 422 with
  `path = "code"`. `shipping_total` in the cart is 0 because no method is chosen yet; checkout computes it.
* **Checkout** returns `201 { order }` in the store order shape. Guest checkout creates or links a passwordless
  customer by email. Errors: 422 for an empty or missing cart, stock problems (one detail per item), bad shipping method
  or payment method; 403 when guest checkout is disabled.
* **Customers**: register returns 201 and the login shape. Registering an email that only exists as a guest upgrades
  that guest account. `POST /store/customers/logout { refresh_token }` is an extra endpoint.
* **Tenant order status**: `delivered` sets `fulfillment_status=fulfilled` (and marks COD payments paid). `shipped`
  sets fulfilled. `cancelled`/`refunded` restock the items (`return` movements) and reverse the customer's totals.
  Every change writes `order_status_history`.
* **Settings `PUT /tenant/settings/:group`**: the body is validated per group. Omitted keys keep their current value,
  arrays are replaced, and the stored group is returned merged with defaults.
* **Uploads** return `201 { url, path, size, mime }`. `url` is absolute (`APP_URL/storage/uploads/<tenant_id>/<file>`).
* **Tenant list responses** include joined objects: products have `category {id,name,slug}` / `brand {id,name,slug}`,
  users have `role {id,name}`, orders have `customer {id,name}` and `items_count`, and payments have `order {...}`.

## Smoke test

With the server running on a freshly seeded DB:

```bash
npm run smoke        # 80 end-to-end checks across all three scopes
```
