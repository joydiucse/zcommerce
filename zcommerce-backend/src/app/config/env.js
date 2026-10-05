import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, '../../..');

dotenv.config({ path: path.join(ROOT_DIR, '.env'), quiet: true });

const str = (key, def = '') => (process.env[key] ?? def).toString();
const int = (key, def) => {
  const v = parseInt(process.env[key] ?? '', 10);
  return Number.isNaN(v) ? def : v;
};
const bool = (key, def = false) => {
  const v = process.env[key];
  if (v === undefined || v === '') return def;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
};

export const env = {
  NODE_ENV: str('NODE_ENV', 'development'),
  PORT: int('PORT', 4000),
  APP_NAME: str('APP_NAME', 'zCommerce'),
  APP_URL: str('APP_URL', 'http://localhost:4000').replace(/\/+$/, ''),
  LOG_LEVEL: str('LOG_LEVEL', 'info'),
  DATABASE_URL: str('DATABASE_URL', 'postgres://postgres:@127.0.0.1:5432/zcommerce'),
  DATABASE_POOL_MIN: int('DATABASE_POOL_MIN', 0),
  DATABASE_POOL_MAX: int('DATABASE_POOL_MAX', 10),
  REDIS_URL: str('REDIS_URL', 'redis://127.0.0.1:6379'),
  JWT_ACCESS_SECRET: str('JWT_ACCESS_SECRET', 'dev-access-secret'),
  JWT_REFRESH_SECRET: str('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  JWT_ACCESS_TTL: int('JWT_ACCESS_TTL', 900),
  JWT_REFRESH_TTL: int('JWT_REFRESH_TTL', 60 * 60 * 24 * 30),
  ENCRYPTION_KEY: str('ENCRYPTION_KEY', 'dev-encryption-key'),
  CORS_ORIGINS: str('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3001'),
  PLATFORM_NAME: str('PLATFORM_NAME', 'zCommerce'),
  PLATFORM_TAGLINE: str('PLATFORM_TAGLINE', 'Launch and grow your online store'),
  ADMIN_URL: str('ADMIN_URL', 'http://localhost:5173'),
  SUPPORT_EMAIL: str('SUPPORT_EMAIL', ''),
  STOREFRONT_URL: str('STOREFRONT_URL', 'http://localhost:3001').replace(/\/+$/, ''),
  REVALIDATE_SECRET: str('REVALIDATE_SECRET', ''),
  UPLOAD_MAX_MB: int('UPLOAD_MAX_MB', 5),
  SMTP_HOST: str('SMTP_HOST'),
  SMTP_PORT: int('SMTP_PORT', 587),
  SMTP_SECURE: bool('SMTP_SECURE', false),
  SMTP_USER: str('SMTP_USER'),
  SMTP_PASS: str('SMTP_PASS'),
  MAIL_FROM: str('MAIL_FROM', 'zCommerce <no-reply@zcommerce.test>'),
};

export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export default env;
