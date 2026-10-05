import appConfig from '../../app/config/app.config.js';
import { env } from '../../app/config/env.js';
import { logger } from '../utils/logger.js';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Storefront cache tags affected by writes under each /tenant/<resource> prefix. */
const TAGS_BY_RESOURCE = {
  settings: ['settings'],
  products: ['products', 'search', 'sitemap'],
  inventory: ['products'],
  categories: ['categories', 'products', 'search', 'sitemap'],
  brands: ['brands', 'products', 'search', 'sitemap'],
  reviews: ['reviews', 'products'],
  pages: ['pages', 'sitemap', 'settings'],
};

/** Storefront servers to notify: the shared STOREFRONT_URL plus the tenant's own site_url (deduped). */
function targetsFor(tenant) {
  const origins = [appConfig.storefrontUrl, tenant?.site_url].map((u) => {
    try {
      return u ? new URL(u).origin : null;
    } catch {
      return null;
    }
  });
  return [...new Set(origins.filter(Boolean))];
}

/** Fire-and-forget POST to the Next.js storefront's /api/revalidate webhook. */
export function revalidateStorefront(tags, tenant = null) {
  if (!env.REVALIDATE_SECRET || !tags.length) return;
  for (const origin of targetsFor(tenant)) postRevalidate(origin, tags);
}

function postRevalidate(origin, tags) {
  fetch(`${origin}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': env.REVALIDATE_SECRET },
    body: JSON.stringify({ tags }),
    signal: AbortSignal.timeout(3000),
  })
    .then((res) => {
      if (!res.ok) logger.warn({ status: res.status, tags }, 'storefront revalidate rejected');
    })
    .catch((err) => logger.debug({ err: err.message, origin, tags }, 'storefront revalidate unreachable'));
}

/**
 * Router-level middleware: after a successful write to a storefront-visible resource,
 * bust the matching storefront cache tags so admin changes show up immediately.
 */
export function storefrontRevalidateMiddleware() {
  return (req, res, next) => {
    if (!MUTATING.has(req.method)) return next();
    const resource = req.path.split('/')[1];
    const tags = TAGS_BY_RESOURCE[resource];
    if (!tags) return next();
    res.on('finish', () => {
      if (res.statusCode < 400) revalidateStorefront(tags, req.tenant);
    });
    return next();
  };
}
