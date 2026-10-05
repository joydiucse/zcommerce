import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listAuditLogsSchema } from './audit-log.validation.js';

export default function auditLogRoutes({ auditLogController: c }) {
  const r = Router();
  r.get('/', can('audit_logs.view'), validate(listAuditLogsSchema), c.list);
  return r;
}
