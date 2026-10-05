import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import redisConfig, { redisConnection } from '../../app/config/redis.config.js';
import { QUEUES } from '../../shared/constants/index.js';
import { logger } from '../../shared/utils/logger.js';
import { closeConnections } from '../../app/database/connection.js';
import { getRedisVersion, versionSupported } from '../queues/index.js';
import { processEmailJob } from '../processors/email.processor.js';
import { processNotificationJob } from '../processors/notification.processor.js';

const definitions = [
  { queue: QUEUES.EMAILS, processor: processEmailJob, concurrency: 5 },
  { queue: QUEUES.NOTIFICATIONS, processor: processNotificationJob, concurrency: 10 },
];

// BullMQ requires Redis >= 5. Check first so an old server gives one clear message instead of an error loop.
const probe = new Redis(redisConfig.url, { maxRetriesPerRequest: 1, lazyConnect: true, connectTimeout: 3000, retryStrategy: () => null });
probe.on('error', () => {}); // reported below
let version = null;
let reachable = true;
try {
  await probe.connect();
  version = await getRedisVersion(probe);
} catch (err) {
  reachable = false;
  logger.error({ err: err.message, url: redisConfig.url }, 'Worker cannot reach Redis');
} finally {
  probe.disconnect();
}

if (!versionSupported(version)) {
  if (reachable) {
    logger.error(
      { version },
      'BullMQ requires Redis >= 5.0. Worker not started; the API processes jobs inline until a supported Redis is available.',
    );
  }
  await closeConnections();
  process.exitCode = 1;
  // Let pino flush, then exit.
  setTimeout(() => process.exit(1), 100);
} else {
  startWorkers();
}

function startWorkers() {
  const connection = { ...redisConnection, maxRetriesPerRequest: null };
  const workers = definitions.map(({ queue, processor, concurrency }) => {
    const worker = new Worker(queue, processor, { connection, concurrency });
    worker.on('ready', () => logger.info({ queue }, 'Worker ready'));
    worker.on('completed', (job, result) => logger.info({ queue, job: job.name, id: job.id, result }, 'Job completed'));
    worker.on('failed', (job, err) => logger.error({ queue, job: job?.name, id: job?.id, err: err.message }, 'Job failed'));
    worker.on('error', (err) => logger.warn({ queue, err: err.message }, 'Worker error'));
    return worker;
  });

  logger.info({ queues: definitions.map((d) => d.queue), redis: version }, 'Workers started');

  async function shutdown(signal) {
    logger.info({ signal }, 'Shutting down workers');
    await Promise.allSettled(workers.map((w) => w.close()));
    await closeConnections();
    process.exit(0);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

