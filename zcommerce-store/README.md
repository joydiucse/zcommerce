# zCommerce Store

The customer storefront for the zCommerce multi-tenant platform. It is built with Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 and react-icons.

The store talks only to the backend `/store/*` API described in [`../CONTRACT.md`](../CONTRACT.md) (`http://localhost:4000/api/v1`). Everything you see is driven by `GET /store/settings`: theme colours, font, radius, logo, navigation, homepage sections, checkout rules, SEO and analytics.

## Quick start

```bash
cd zcommerce-store
cp .env.example .env.local   # already present for local dev
npm install
npm run dev                  # http://localhost:3001
```

Production:

```bash
npm run build && npm run start   # port 3000
```

Other scripts: `npm run lint` (ESLint), `npm run typecheck` (tsc).

The build does not depend on the backend. If the API cannot be reached, settings fall back to `src/lib/defaults.ts` (a copy of the contract defaults), lists come back empty, `generateStaticParams` returns `[]`, and pages are regenerated through ISR once the API is reachable.

### Environment

| Variable | Default | Purpose |
|---|---|---|
| `API_URL` | `http://localhost:4000/api/v1` | API base for server components, the sitemap and OG images |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | API base for the browser (cart, checkout, account, live search) |
| `STORE_TENANT` | `demo` | Pins one tenant, sent as `X-Tenant`. Leave it empty for host-based multi-tenancy |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3001` | Public URL, used as the canonical/OG fallback |
| `REVALIDATE_SECONDS` | `60` | `next.revalidate` for every API fetch |
| `REVALIDATE_SECRET` | `change-me` | Shared secret for `POST /api/revalidate` |

## Multi-tenancy and domain mapping

`src/proxy.ts` (Next 16's replacement for middleware) rewrites every storefront request internally to `/<domain-key>/<path>`, which is served by `src/app/[domain]/…`. The visible URL does not change. Because the tenant is part of the route, each tenant gets its own ISR cache entries, and pages never need to call `headers()`.

| Mode | Domain key | Headers sent to the API |
|---|---|---|
| `STORE_TENANT=demo` (local dev, single-tenant deploys) | `_default` | `X-Tenant: demo` (this wins on the backend) and `X-Store-Domain: <host of NEXT_PUBLIC_SITE_URL>` |
| `STORE_TENANT` empty (SaaS) | request host, lower-cased, port removed (e.g. `shop.acme.com`) | `X-Store-Domain: shop.acme.com`, which the backend resolves against `tenants.custom_domain` |

To map a merchant domain:

1. Point the domain's DNS (A or CNAME record) at the storefront deployment.
2. Set the tenant's `custom_domain` to that hostname in the system admin.
3. Run the store with `STORE_TENANT` unset. Requests for `shop.acme.com` now render that tenant's catalogue, theme and SEO, and its canonical URLs use `https://shop.acme.com`. If `seo.canonical_url` is set, it takes priority.

Browser-side calls send `X-Tenant: <settings.tenant.slug>`, which the root layout passes down through `StoreProvider`. The backend must allow the `X-Tenant`, `X-Cart-Token` and `Authorization` headers in CORS for the storefront origin.

## Settings-driven storefront

- **theme**: `--color-primary`, `--color-secondary`, `--color-accent`, `--radius` and `--font-store` are injected inline on `<html>`. They map to Tailwind tokens (`bg-primary`, `text-accent`, `rounded-brand`, `rounded-card`, …), and the text colour on primary is picked automatically for contrast. Fonts come from `next/font/google`: Inter, Poppins, Roboto, Lato, Montserrat, Open Sans and Playfair Display. Unknown fonts fall back to Inter.
- **general**: store name and logo in the header, the favicon (metadata icons and manifest), contact details in the footer, and `Intl.NumberFormat(locale, { style: "currency", currency })` everywhere.
- **homepage**: announcement bar, hero slider (autoplay, pause, keyboard and screen-reader friendly), featured categories (`featured_category_ids`), featured products, new arrivals, brands strip and newsletter. Each block is toggled by `sections`, and product counts come from `products_per_section`.
- **navigation**: header menu (desktop and mobile drawer) and footer menu columns. Pages flagged `show_in_footer` are added to the footer automatically.
- **social**: footer icons.
- **checkout**: guest checkout on/off (sign-in is required when it is off), COD and manual payment toggles, manual payment instructions, minimum order amount and the terms link (`terms_page_slug`).

## Pages

`/`, `/products` (filters, sort and pagination, all in the URL), `/products/[slug]`, `/categories`, `/categories/[slug]`, `/brands`, `/brands/[slug]`, `/search?q=`, `/pages/[slug]`, `/cart`, `/checkout`, `/checkout/success?order=&email=`, `/account/login`, `/account/register`, `/account` (profile and address book), `/account/orders` and `/account/orders/[orderNumber]`.

- The cart token is stored in both localStorage and a cookie (`zc_cart_<tenant>`). It is updated from every cart response, and the header has a slide-over mini-cart.
- Customer tokens are stored in localStorage. When a call returns 401, the client refreshes once through `/store/customers/refresh`; if that fails, the user is signed out.

## SEO features

- `generateMetadata` on every route. Titles use `seo.title_template` through `title.template`. Each page also sets a description, keywords, a canonical URL (`metadataBase` comes from `seo.canonical_url`, then the env/host), Open Graph (with `product:*` tags on products), a Twitter `summary_large_image` card with the site handle, `robots` from `seo.robots_index` (always noindex on cart, checkout, account, search and filtered listings), Google and Bing verification, and favicon icons. Products, categories, brands and pages use their own `meta_title` and `meta_description` when present.
- JSON-LD through a `JsonLd` component that escapes `<`: `Organization` and `WebSite` with a sitelinks `SearchAction` (when `organization_schema` is on), `Product` with `Offer`, `AggregateRating` and `Review`, `BreadcrumbList` on product, category, brand and CMS pages, and `ItemList` on listing pages.
- `sitemap.xml` is built from `GET /store/sitemap` plus the static routes, with `lastModified`. `robots.txt` respects `robots_index`, disallows `/cart`, `/checkout`, `/account`, `/search?` and `/api/`, and links the sitemap. `manifest.webmanifest` is generated from settings.
- Dynamic OG images use `next/og`: the product image comes from `products/[slug]/opengraph-image.tsx` (product photo, name, brand and price on the theme gradient, with a matching twitter-image), and a default store card uses `seo.og_image_url` as artwork when it is set.
- GA4, GTM (including the noscript iframe) and Facebook Pixel are added with `next/script`, each only when its ID is configured.
- The markup is semantic: header, nav, main and footer elements, one `h1` per page, a skip link, and breadcrumbs inside `nav[aria-label]`. Images use `next/image` with alt text. Pagination emits `rel=prev/next` links and a self-referencing canonical, and real 404 status codes come from `notFound()` (detail routes have no streaming boundary that could downgrade the status to 200).
- Caching: home, product, CMS, category-index and brand-index pages are ISR (`revalidate = 60`). `generateStaticParams` prerenders the top 24 products, all CMS pages, categories and brands in pinned mode, and returns `[]` when the API is unreachable. Listing pages with URL filters render per request, but their API fetches stay cached for `REVALIDATE_SECONDS`.

## Revalidation webhook

`POST /api/revalidate` busts cached data on demand. The admin panel or the backend can call it after content changes.

```bash
curl -X POST http://localhost:3001/api/revalidate \
  -H "x-revalidate-secret: change-me" \
  -H "content-type: application/json" \
  -d '{"tags":["settings"]}'
```

- The secret can be sent in the `x-revalidate-secret` header, as `?secret=` or as `body.secret`. A wrong secret returns 401.
- Body fields (all optional): `tags: string[]`, `paths: string[]` and `type: "page" | "layout"`. Sending an empty body revalidates the whole site (layout `/`).
- Tags: `settings`, `products`, `product:<slug>`, `reviews`, `reviews:<slug>`, `categories`, `category:<slug>`, `brands`, `brand:<slug>`, `pages`, `page:<slug>`, `search` and `sitemap`. Every tag also has a tenant-scoped form `<tenant-or-host>:<tag>` (for example `demo:products`), and `tenant:<tenant-or-host>` covers everything for one tenant.
- Paths are internal paths, so include the domain key: `/_default/products/my-tee` in pinned mode, or `/<host>/…` in multi-tenant mode. Tags are usually simpler.

## Project layout

```
src/
  proxy.ts                 host → /[domain] rewrite
  app/
    [domain]/              all storefront routes (layout = root layout)
    api/revalidate/        cache-busting webhook
    sitemap.ts robots.ts manifest.ts
  components/              layout, home, product, cart, checkout, account, ui, seo, providers
  lib/
    api.ts                 server-only Store API (fetch + revalidate + tags, never throws on outages)
    client-api.ts          browser client (X-Tenant, X-Cart-Token, token refresh)
    defaults.ts            contract default settings
    seo.ts structured-data.ts og.tsx site.ts fonts.ts …
```

## Known limitations

- The contract has no newsletter endpoint, so the sign-up form validates the email and shows a confirmation without storing anything.
- `next/font/google` downloads fonts at build time, so `npm run build` needs internet access to fonts.googleapis.com.
- Shipping totals on checkout are estimated on the client (cart total minus cart shipping plus the selected method's `cost`). The backend computes the final order totals.
