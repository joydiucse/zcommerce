import { Router } from 'express';
import { requireSystemAuth } from '../app/middleware/system.middleware.js';
import systemAuthRoutes from '../modules/system/auth/auth.routes.js';
import tenantRoutes, { systemDashboardRoutes } from '../modules/system/tenants/tenant.routes.js';
import planRoutes from '../modules/system/plans/plan.routes.js';
import subscriptionRoutes from '../modules/system/subscriptions/subscription.routes.js';
import billingRoutes from '../modules/system/billing/billing.routes.js';
import systemUserRoutes from '../modules/system/users/user.routes.js';
import systemRoleRoutes from '../modules/system/roles/role.routes.js';
import systemPermissionRoutes from '../modules/system/permissions/permission.routes.js';
import auditLogRoutes from '../modules/system/audit-logs/audit-log.routes.js';

/** /api/v1/system/* — platform super-admins (aud=system). */
export default function systemRoutes(container) {
  const r = Router();
  r.use('/auth', systemAuthRoutes(container));

  r.use(requireSystemAuth());
  r.use('/dashboard', systemDashboardRoutes(container));
  r.use('/tenants', tenantRoutes(container));
  r.use('/plans', planRoutes(container));
  r.use('/subscriptions', subscriptionRoutes(container));
  r.use('/billing', billingRoutes(container));
  r.use('/users', systemUserRoutes(container));
  r.use('/roles', systemRoleRoutes(container));
  r.use('/permissions', systemPermissionRoutes(container));
  r.use('/audit-logs', auditLogRoutes(container));
  return r;
}
