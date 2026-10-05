import path from 'node:path';
import { env, ROOT_DIR } from './env.js';

export default {
  name: env.APP_NAME,
  env: env.NODE_ENV,
  port: env.PORT,
  url: env.APP_URL,
  apiPrefix: '/api/v1',
  logLevel: env.LOG_LEVEL,
  logsDir: path.join(ROOT_DIR, 'logs'),
  corsOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  platform: {
    name: env.PLATFORM_NAME,
    tagline: env.PLATFORM_TAGLINE,
    adminUrl: env.ADMIN_URL,
    supportEmail: env.SUPPORT_EMAIL || null,
  },
  storefrontUrl: env.STOREFRONT_URL,
  rateLimit: {
    general: { windowSec: 60, max: 600 },
    login: { windowSec: 60, max: 10 },
  },
  cacheTtl: {
    tenant: 300,
    settings: 300,
    permissions: 60,
  },
};
