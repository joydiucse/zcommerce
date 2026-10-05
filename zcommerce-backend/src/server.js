import http from 'node:http';
import appConfig from './app/config/app.config.js';
import { createApp } from './app.js';
import { closeConnections, checkDatabase } from './app/database/connection.js';
import { closeQueues } from './jobs/queues/index.js';
import { logger } from './shared/utils/logger.js';

const app = createApp();
const server = http.createServer(app);

server.listen(appConfig.port, async () => {
  logger.info({ port: appConfig.port, env: appConfig.env, url: appConfig.url }, `${appConfig.name} API listening`);
  if (!(await checkDatabase())) logger.error('Database is not reachable — check DATABASE_URL');
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down');
  const force = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  force.unref();
  server.close(async () => {
    await closeQueues();
    await closeConnections();
    logger.info('Shutdown complete');
    process.exit(0);
  });
  server.closeIdleConnections?.();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (err) => logger.error({ err }, 'Unhandled promise rejection'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  shutdown('uncaughtException');
});
