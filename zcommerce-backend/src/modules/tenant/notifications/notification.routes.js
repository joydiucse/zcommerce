import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listNotificationsSchema, idParams } from './notification.validation.js';

export default function notificationRoutes({ notificationController: c }) {
  const r = Router();
  r.get('/', can('notifications.view'), validate(listNotificationsSchema), c.list);
  r.get('/unread-count', can('notifications.view'), c.unreadCount);
  r.post('/read-all', can('notifications.view'), c.markAllRead);
  r.post('/:id/read', can('notifications.view'), validate({ params: idParams }), c.markRead);
  return r;
}
