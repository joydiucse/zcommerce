import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';

export default function systemPermissionRoutes({ systemPermissionController: c }) {
  const r = Router();
  r.get('/', can('roles.view'), c.list);
  return r;
}
