import path from 'node:path';
import { env, ROOT_DIR } from './env.js';

export default {
  client: 'pg',
  connection: env.DATABASE_URL,
  pool: { min: env.DATABASE_POOL_MIN, max: env.DATABASE_POOL_MAX },
  migrations: {
    directory: path.join(ROOT_DIR, 'src/app/database/migrations'),
    tableName: 'knex_migrations',
    loadExtensions: ['.js'],
  },
  seeds: {
    directory: path.join(ROOT_DIR, 'src/app/database/seeders'),
    loadExtensions: ['.js'],
  },
};
