import { ok } from '../../../shared/helpers/response.js';

export class NotificationController {
  constructor({ notificationService: s }) {
    this.list = async (req, res) => {
      const { data, meta } = await s.list(req.user.id, req.query);
      return ok(res, data, meta);
    };
    this.unreadCount = async (req, res) => ok(res, await s.unreadCount(req.user.id));
    this.markRead = async (req, res) => ok(res, await s.markRead(req.user.id, req.params.id));
    this.markAllRead = async (req, res) => ok(res, await s.markAllRead(req.user.id));
  }
}
