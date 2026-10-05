import { env } from './env.js';

const u = new URL(env.REDIS_URL);

/** Connection options usable by both ioredis and BullMQ (which bundles its own ioredis). */
export const redisConnection = {
  host: u.hostname || '127.0.0.1',
  port: Number(u.port || 6379),
  username: u.username || undefined,
  password: u.password ? decodeURIComponent(u.password) : undefined,
  db: u.pathname && u.pathname.length > 1 ? Number(u.pathname.slice(1)) : 0,
  ...(u.protocol === 'rediss:' ? { tls: {} } : {}),
};

export default {
  url: env.REDIS_URL,
  connection: redisConnection,
  keys: {
    cart: (tenantId, token) => `cart:${tenantId}:${token}`,
    settings: (tenantId) => `settings:${tenantId}`,
    tenantSlug: (slug) => `tenant:slug:${slug}`,
    tenantDomain: (host) => `tenant:domain:${host}`,
    tenantId: (id) => `tenant:id:${id}`,
    refresh: (aud, jti) => `refresh:${aud}:${jti}`,
    permissions: (scope, roleId) => `perms:${scope}:${roleId}`,
    rateLimit: (bucket, key, window) => `rl:${bucket}:${key}:${window}`,
  },
  cartTtl: 60 * 60 * 24 * 30,
};
