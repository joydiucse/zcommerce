import { redis, isRedisReady } from '../database/connection.js';
import redisConfig from '../config/redis.config.js';
import appConfig from '../config/app.config.js';
import { RateLimitedError } from '../../shared/exceptions/index.js';
import { logger } from '../../shared/utils/logger.js';
import { isTest } from '../config/env.js';

/**
 * Redis fixed-window rate limiter. Fails open when Redis is unavailable.
 * @param {{ bucket: string, windowSec: number, max: number, key?: (req) => string }} opts
 */
export function rateLimit({ bucket, windowSec, max, key = (req) => req.ip }) {
  return async (req, res, next) => {
    if (isTest || !isRedisReady()) return next();
    try {
      const window = Math.floor(Date.now() / 1000 / windowSec);
      const redisKey = redisConfig.keys.rateLimit(bucket, key(req), window);
      const results = await redis.multi().incr(redisKey).expire(redisKey, windowSec + 1).exec();
      const count = Number(results?.[0]?.[1] || 0);
      const resetIn = windowSec - (Math.floor(Date.now() / 1000) % windowSec);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader('X-RateLimit-Reset', resetIn);
      if (count > max) {
        res.setHeader('Retry-After', resetIn);
        return next(new RateLimitedError());
      }
    } catch (err) {
      logger.debug({ err: err.message }, 'rate limiter failed open');
    }
    return next();
  };
}

export const generalLimiter = rateLimit({ bucket: 'api', ...appConfig.rateLimit.general });

/** Strict limiter for login endpoints: per IP + route + submitted email. */
export const loginLimiter = rateLimit({
  bucket: 'login',
  ...appConfig.rateLimit.login,
  key: (req) => `${req.ip}:${req.baseUrl}${req.path}:${String(req.body?.email || '').toLowerCase()}`,
});

export default rateLimit;
