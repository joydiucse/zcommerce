import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';

export default function tenantPermissionRoutes({ tenantPermissionController: c }) {
  const r = Router();
  r.get('/', can('roles.view'), c.list);
  return r;
}
