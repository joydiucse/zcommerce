import { TenantRepository, scopedInsert } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class NotificationRepository extends TenantRepository {
  constructor() {
    super({ table: 'notifications', jsonColumns: ['data'] });
  }

  /** Notifications visible to a staff user: addressed to them or to everyone (user_id null). */
  visibleTo(userId) {
    return this.query().where((b) => b.whereNull('notifications.user_id').orWhere('notifications.user_id', userId));
  }

  async list(userId, query = {}) {
    const qb = this.visibleTo(userId).select('notifications.*');
    if (query.unread === true || query.unread === 'true') qb.whereNull('notifications.read_at');
    if (query.type) qb.where('notifications.type', query.type);
    return paginateQuery(qb, query, { sortable: { created_at: 'notifications.created_at' } });
  }

  async unreadCount(userId) {
    const row = await this.visibleTo(userId).whereNull('read_at').count({ count: '*' }).first();
    return row.count;
  }

  async markRead(userId, id) {
    const [row] = await this.visibleTo(userId).where('notifications.id', id).update({ read_at: db.raw('coalesce(read_at, now())') }).returning('*');
    return row;
  }

  markAllRead(userId) {
    return this.visibleTo(userId).whereNull('read_at').update({ read_at: db.fn.now() });
  }

  /** Insert a notification inside the current tenant (optionally within a transaction). */
  async notify({ type, title, body = null, data = null, user_id = null }, trx = null) {
    const [row] = await scopedInsert('notifications', { type, title, body, data: data ? JSON.stringify(data) : null, user_id }, trx);
    return row;
  }
}
