import { env } from './env.js';

export default {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessTtl: env.JWT_ACCESS_TTL,
  refreshTtl: env.JWT_REFRESH_TTL,
  issuer: 'zcommerce',
  audiences: ['system', 'tenant', 'customer'],
};
