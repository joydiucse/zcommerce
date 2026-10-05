import { Queue } from 'bullmq';
import { redisConnection } from '../../app/config/redis.config.js';
import { QUEUES } from '../../shared/constants/index.js';
import { logger } from '../../shared/utils/logger.js';
import { isTest } from '../../app/config/env.js';
import { redis, isRedisReady } from '../../app/database/connection.js';
import { processEmailJob } from '../processors/email.processor.js';
import { processNotificationJob } from '../processors/notification.processor.js';

const queues = new Map();
const inlineProcessors = {
  [QUEUES.EMAILS]: processEmailJob,
  [QUEUES.NOTIFICATIONS]: processNotificationJob,
};

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 500,
  removeOnFail: 1000,
};

let support = null; // null = unknown; true/false once the Redis version has been checked

/** Redis server version string (e.g. "5.0.14"). */
export async function getRedisVersion(client = redis) {
  const info = await client.info('server');
  const m = /redis_version:([\d.]+)/.exec(info);
  return m ? m[1] : null;
}

/** BullMQ requires Redis >= 5.0. */
export const versionSupported = (v) => Number(String(v || '0').split('.')[0]) >= 5;

async function bullmqSupported() {
  if (support !== null) return support;
  if (!isRedisReady()) return false; // unknown yet: try again next time
  try {
    const version = await getRedisVersion();
    support = versionSupported(version);
    if (!support) logger.warn({ version }, 'Redis < 5.0: BullMQ disabled, background jobs run inline in the API process');
  } catch {
    return false;
  }
  return support;
}

export function getQueue(name) {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      connection: { ...redisConnection, maxRetriesPerRequest: 1, enableOfflineQueue: false, connectTimeout: 3000 },
      defaultJobOptions,
    });
    queue.on('error', (err) => logger.debug({ err: err.message, queue: name }, 'queue error'));
    queues.set(name, queue);
  }
  return queues.get(name);
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`enqueue timed out after ${ms}ms`)), ms))]);

/**
 * Add a job. Never throws: if Redis is down or too old for BullMQ, the job is processed inline
 * (fire-and-forget) so the API keeps working.
 */
export async function enqueue(queueName, jobName, data, opts = {}) {
  if (isTest) return null;
  try {
    if (!(await bullmqSupported())) throw new Error('BullMQ unavailable (Redis down or < 5.0)');
    const job = await withTimeout(getQueue(queueName).add(jobName, data, opts), 2500);
    return job.id;
  } catch (err) {
    logger.debug({ err: err.message, queue: queueName, job: jobName }, 'Enqueue skipped; processing inline');
    const processor = inlineProcessors[queueName];
    if (processor) {
      setImmediate(() => {
        processor({ name: jobName, data }).catch((e) => logger.error({ err: e.message, job: jobName }, 'Inline job failed'));
      });
    }
    return null;
  }
}

export const enqueueEmail = (name, data, opts) => enqueue(QUEUES.EMAILS, name, data, opts);
export const enqueueNotification = (name, data, opts) => enqueue(QUEUES.NOTIFICATIONS, name, data, opts);

export async function closeQueues() {
  await Promise.allSettled([...queues.values()].map((q) => q.close()));
  queues.clear();
}
