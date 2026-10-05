import { Router } from 'express';
import { checkDatabase, checkRedis } from '../app/database/connection.js';
import systemRoutes from './system.routes.js';
import tenantRoutes from './tenant.routes.js';
import storeRoutes from './store.routes.js';

export async function healthHandler(_req, res) {
  const [dbUp, redisUp] = await Promise.all([checkDatabase(), checkRedis()]);
  const status = dbUp ? 'ok' : 'degraded';
  const payload = { status, db: dbUp ? 'up' : 'down', redis: redisUp ? 'up' : 'down' };
  // Contract shape at the top level, plus the standard envelope's `data` for generic clients.
  res.status(dbUp ? 200 : 503).json({ success: dbUp, ...payload, data: { ...payload, uptime: Math.round(process.uptime()) } });
}

/** Everything under /api/v1. */
export default function apiRoutes(container) {
  const r = Router();
  r.get('/health', healthHandler);
  r.use('/system', systemRoutes(container));
  r.use('/tenant', tenantRoutes(container));
  r.use('/store', storeRoutes(container));
  return r;
}
