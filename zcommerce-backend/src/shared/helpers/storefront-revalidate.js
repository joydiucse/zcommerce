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

/** Fire-and-forget POST to the Next.js storefront's /api/revalidate webhook. */
export function revalidateStorefront(tags) {
  if (!env.REVALIDATE_SECRET || !appConfig.storefrontUrl || !tags.length) return;
  fetch(`${appConfig.storefrontUrl}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': env.REVALIDATE_SECRET },
    body: JSON.stringify({ tags }),
    signal: AbortSignal.timeout(3000),
  })
    .then((res) => {
      if (!res.ok) logger.warn({ status: res.status, tags }, 'storefront revalidate rejected');
    })
    .catch((err) => logger.debug({ err: err.message, tags }, 'storefront revalidate unreachable'));
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
      if (res.statusCode < 400) revalidateStorefront(tags);
    });
    return next();
  };
}
