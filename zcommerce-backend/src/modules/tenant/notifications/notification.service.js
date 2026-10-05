import { NotFoundError } from '../../../shared/exceptions/index.js';

export class NotificationService {
  constructor({ notificationRepository }) {
    this.repo = notificationRepository;
  }

  list(userId, query) {
    return this.repo.list(userId, query);
  }

  async unreadCount(userId) {
    return { count: await this.repo.unreadCount(userId) };
  }

  async markRead(userId, id) {
    const row = await this.repo.markRead(userId, id);
    if (!row) throw new NotFoundError('Notification not found');
    return row;
  }

  async markAllRead(userId) {
    return { updated: await this.repo.markAllRead(userId) };
  }

  notify(data, trx) {
    return this.repo.notify(data, trx);
  }
}
