import { redis, isRedisReady } from '../../app/database/connection.js';
import { logger } from './logger.js';

/**
 * JSON cache backed by Redis with an in-process fallback (used when Redis is down).
 */
const memory = new Map();

function memGet(key) {
  const hit = memory.get(key);
  if (!hit) return undefined;
  if (hit.expires && hit.expires < Date.now()) {
    memory.delete(key);
    return undefined;
  }
  return hit.value;
}

function memSet(key, value, ttlSec) {
  memory.set(key, { value, expires: ttlSec ? Date.now() + ttlSec * 1000 : null });
  if (memory.size > 5000) memory.delete(memory.keys().next().value);
}

export const cache = {
  async get(key) {
    if (isRedisReady()) {
      try {
        const raw = await redis.get(key);
        return raw === null ? undefined : JSON.parse(raw);
      } catch (err) {
        logger.debug({ err: err.message, key }, 'cache get failed, using memory');
      }
    }
    return memGet(key);
  },

  async set(key, value, ttlSec) {
    if (isRedisReady()) {
      try {
        if (ttlSec) await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
        else await redis.set(key, JSON.stringify(value));
        memory.delete(key);
        return;
      } catch (err) {
        logger.debug({ err: err.message, key }, 'cache set failed, using memory');
      }
    }
    memSet(key, value, ttlSec);
  },

  async del(...keys) {
    const list = keys.flat().filter(Boolean);
    list.forEach((k) => memory.delete(k));
    if (!list.length || !isRedisReady()) return;
    try {
      await redis.del(...list);
    } catch (err) {
      logger.debug({ err: err.message }, 'cache del failed');
    }
  },

  /** Get from cache or compute + store. `null`/`undefined` results are not cached. */
  async remember(key, ttlSec, fn) {
    const hit = await this.get(key);
    if (hit !== undefined) return hit;
    const value = await fn();
    if (value !== null && value !== undefined) await this.set(key, value, ttlSec);
    return value;
  },

  _memory: memory,
};

export default cache;
