import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listTenantsSchema, createTenantSchema, updateTenantSchema, idParams } from './tenant.validation.js';

export default function tenantRoutes({ tenantController: c }) {
  const r = Router();
  r.get('/', can('tenants.view'), validate(listTenantsSchema), c.list);
  r.post('/', can('tenants.create'), validate(createTenantSchema), c.create);
  r.get('/:id', can('tenants.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('tenants.update'), validate(updateTenantSchema), c.update);
  r.delete('/:id', can('tenants.delete'), validate({ params: idParams }), c.destroy);
  r.post('/:id/suspend', can('tenants.update'), validate({ params: idParams }), c.suspend);
  r.post('/:id/activate', can('tenants.update'), validate({ params: idParams }), c.activate);
  return r;
}

/** GET /system/dashboard lives with the tenants module (it is a tenants/revenue overview). */
export function systemDashboardRoutes({ tenantController: c }) {
  const r = Router();
  r.get('/', can('dashboard.view'), c.dashboard);
  return r;
}
