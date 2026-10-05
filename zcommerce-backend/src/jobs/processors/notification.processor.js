import { db } from '../../app/database/connection.js';

/**
 * BullMQ processor for the `notifications` queue.
 * job.data = { tenant_id, user_id?, type, title, body?, data? } -> inserts a tenant notification.
 */
export async function processNotificationJob(job) {
  const { tenant_id, user_id = null, type, title, body = null, data = null } = job.data || {};
  if (!tenant_id || !type || !title) return { skipped: true };
  const [row] = await db('notifications')
    .insert({ tenant_id, user_id, type, title, body, data: data ? JSON.stringify(data) : null })
    .returning('id');
  return { id: row.id };
}

export default processNotificationJob;
