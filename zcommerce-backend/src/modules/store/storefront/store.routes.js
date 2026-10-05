import { Router } from 'express';

/** Mounted at /store (tenant-scoped): GET /resolve, GET /settings, GET /sitemap */
export default function storefrontRoutes({ storefrontController: c }) {
  const r = Router();
  r.get('/resolve', c.resolve);
  r.get('/settings', c.settings);
  r.get('/sitemap', c.sitemap);
  return r;
}

/** Mounted at /store before tenant resolution: GET /platform (public platform details). */
export function platformRoutes({ storefrontController: c }) {
  const r = Router();
  r.get('/platform', c.platform);
  return r;
}
