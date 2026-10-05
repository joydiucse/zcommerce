import path from 'node:path';
import { env, ROOT_DIR } from './env.js';

export default {
  root: path.join(ROOT_DIR, 'storage'),
  uploadsDir: path.join(ROOT_DIR, 'storage', 'uploads'),
  publicPath: '/storage',
  publicUrl: `${env.APP_URL}/storage`,
  maxFileSize: env.UPLOAD_MAX_MB * 1024 * 1024,
  allowedMimes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif'],
};
