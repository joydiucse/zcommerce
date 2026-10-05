import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';

export default function dashboardRoutes({ dashboardController: c }) {
  const r = Router();
  r.get('/', can('dashboard.view'), c.overview);
  return r;
}
