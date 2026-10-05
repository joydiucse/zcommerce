import { authenticate } from './auth.middleware.js';
import { loadRolePermissions } from './permission.middleware.js';
import { resolveTenantById } from '../tenant/tenant-resolver.js';
import { runWithTenant } from '../tenant/tenant-context.js';
import { scoped } from '../tenant/tenant-scope.js';
import { TenantNotFoundError, TenantSuspendedError, UnauthenticatedError } from '../../shared/exceptions/index.js';

/**
 * Requires aud=tenant. Loads the tenant from the JWT `tenant_id` into the AsyncLocalStorage
 * context (rejecting suspended tenants), then loads the staff user + role permissions.
 */
export function requireTenantAuth() {
  const verify = authenticate('tenant');
  return [
    verify,
    async (req, res, next) => {
      try {
        const tenant = await resolveTenantById(req.auth.tenant_id);
        if (!tenant) throw new TenantNotFoundError();
        if (tenant.status === 'suspended') throw new TenantSuspendedError();
        req.tenant = tenant;
        runWithTenant(tenant, async () => {
          try {
            const user = await scoped('users', null, tenant.id).where('users.id', req.auth.sub).first();
            if (!user || user.status !== 'active') throw new UnauthenticatedError('Account is disabled or no longer exists');
            delete user.password_hash;
            req.user = user;
            req.actor = { type: 'tenant', id: user.id };
            req.permissions = await loadRolePermissions('tenant', user.role_id);
            next();
          } catch (err) {
            next(err);
          }
        });
      } catch (err) {
        next(err);
      }
    },
  ];
}

export default requireTenantAuth;
