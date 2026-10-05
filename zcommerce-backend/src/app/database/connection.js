import knexFactory from 'knex';
import pg from 'pg';
import { Redis } from 'ioredis';
import databaseConfig from '../config/database.config.js';
import redisConfig from '../config/redis.config.js';
import { logger } from '../../shared/utils/logger.js';

// PG NUMERIC (1700) -> JS number, INT8 (20) -> JS number (counts/sums).
pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
pg.types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));

export const db = knexFactory(databaseConfig);

export const redis = new Redis(redisConfig.url, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 3000,
  lazyConnect: false,
  retryStrategy: (times) => Math.min(times * 500, 5000),
});

let redisReady = false;
let redisErrorLogged = false;
redis.on('ready', () => {
  redisReady = true;
  redisErrorLogged = false;
  logger.info('Redis connected');
});
redis.on('end', () => {
  redisReady = false;
});
redis.on('error', (err) => {
  redisReady = false;
  if (!redisErrorLogged) {
    logger.warn({ err: err.message }, 'Redis unavailable');
    redisErrorLogged = true;
  }
});

export const isRedisReady = () => redisReady && redis.status === 'ready';

/** Wait (briefly) for Redis to become ready; resolves false on timeout. */
export function waitForRedis(timeoutMs = 2000) {
  if (isRedisReady()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      redis.off('ready', onReady);
      resolve(false);
    }, timeoutMs);
    const onReady = () => {
      clearTimeout(t);
      resolve(true);
    };
    redis.once('ready', onReady);
  });
}

export async function checkDatabase() {
  try {
    await db.raw('select 1');
    return true;
  } catch {
    return false;
  }
}

export async function checkRedis() {
  try {
    if (!isRedisReady()) return false;
    return (await redis.ping()) === 'PONG';
  } catch {
    return false;
  }
}

export async function closeConnections() {
  await Promise.allSettled([db.destroy(), redis.quit().catch(() => redis.disconnect())]);
}
