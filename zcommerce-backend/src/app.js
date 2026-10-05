import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import appConfig from './app/config/app.config.js';
import storageConfig from './app/config/storage.config.js';
import { container as defaultContainer } from './app/container.js';
import { requestId } from './app/middleware/request-id.middleware.js';
import { generalLimiter } from './app/middleware/rate-limit.middleware.js';
import { notFoundHandler, errorHandler } from './app/middleware/error.middleware.js';
import apiRoutes, { healthHandler } from './routes/index.js';
import { logger } from './shared/utils/logger.js';

export function createApp({ container = defaultContainer } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.set('query parser', 'extended');

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
      autoLogging: { ignore: (req) => req.url === '/health' },
    }),
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // uploaded images are embedded by the admin/store apps
    }),
  );
  const corsBase = {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant', 'X-Store-Domain', 'X-Cart-Token', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'X-Cart-Token', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
    maxAge: 600,
  };
  const storePrefix = `${appConfig.apiPrefix}/store`;
  app.use(
    cors((req, cb) => {
      // Storefronts live on arbitrary tenant domains/ports and auth with bearer tokens (no cookies),
      // so the public store API accepts any origin; admin/system APIs keep the CORS_ORIGINS allowlist.
      if (req.path === storePrefix || req.path.startsWith(`${storePrefix}/`)) return cb(null, { ...corsBase, origin: true });
      const origin = req.get('origin');
      const allowed = !origin || appConfig.corsOrigins.includes('*') || appConfig.corsOrigins.includes(origin);
      return cb(null, { ...corsBase, origin: allowed });
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(storageConfig.publicPath, express.static(storageConfig.root, { maxAge: '7d', index: false, dotfiles: 'deny' }));

  app.get('/health', healthHandler);
  app.get('/', (_req, res) => res.json({ success: true, data: { name: appConfig.name, api: `${appConfig.url}${appConfig.apiPrefix}` } }));
  app.use(appConfig.apiPrefix, generalLimiter, apiRoutes(container));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export default createApp;
