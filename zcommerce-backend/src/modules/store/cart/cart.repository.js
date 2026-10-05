import redisConfig from '../../../app/config/redis.config.js';
import { cache } from '../../../shared/utils/cache.js';

/** Carts live in Redis at `cart:<tenant_id>:<token>` (TTL 30 days, refreshed on every write). */
export class CartRepository {
  get(tenantId, token) {
    if (!token || !/^[a-zA-Z0-9-]{16,64}$/.test(token)) return Promise.resolve(undefined);
    return cache.get(redisConfig.keys.cart(tenantId, token));
  }

  save(tenantId, cart) {
    cart.updated_at = new Date().toISOString();
    return cache.set(redisConfig.keys.cart(tenantId, cart.token), cart, redisConfig.cartTtl);
  }

  delete(tenantId, token) {
    return cache.del(redisConfig.keys.cart(tenantId, token));
  }
}
