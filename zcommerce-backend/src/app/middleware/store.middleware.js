import { resolveTenantBySlug } from '../tenant/tenant-resolver.js';
import { resolveTenantByDomain } from '../tenant/domain-resolver.js';
import { runWithTenant } from '../tenant/tenant-context.js';
import { scoped } from '../tenant/tenant-scope.js';
import { authenticate } from './auth.middleware.js';
import { TenantNotFoundError, TenantSuspendedError, UnauthenticatedError } from '../../shared/exceptions/index.js';

/**
 * Resolve the store tenant: X-Tenant (slug, sent by browser clients once the store is known)
 * -> X-Store-Domain (storefront request host, port kept) -> Host. No fallback: an unmatched
 * host is TENANT_NOT_FOUND so the storefront can show its "store not found" page.
 */
export async function resolveStoreTenant(req) {
  const slug = req.get('x-tenant');
  if (slug) return resolveTenantBySlug(slug);
  const storeDomain = req.get('x-store-domain');
  if (storeDomain) return resolveTenantByDomain(storeDomain);
  return resolveTenantByDomain(req.get('x-forwarded-host') || req.get('host') || '');
}

export function storeTenant() {
  return async (req, _res, next) => {
    try {
      const tenant = await resolveStoreTenant(req);
      if (!tenant) throw new TenantNotFoundError();
      if (tenant.status === 'suspended') throw new TenantSuspendedError();
      req.tenant = tenant;
      runWithTenant(tenant, () => next());
    } catch (err) {
      next(err);
    }
  };
}

/** Customer auth for the store (aud=customer). Must run after storeTenant(). */
export function customerAuth({ optional = false } = {}) {
  const verify = authenticate('customer', { optional });
  return [
    verify,
    async (req, _res, next) => {
      try {
        if (!req.auth) return next();
        if (req.auth.tenant_id !== req.tenant.id) throw new UnauthenticatedError('Token does not belong to this store');
        const customer = await scoped('customers', null, req.tenant.id).where('customers.id', req.auth.sub).first();
        if (!customer || customer.status !== 'active') throw new UnauthenticatedError('Account is disabled or no longer exists');
        delete customer.password_hash;
        req.customer = customer;
        return next();
      } catch (err) {
        return next(err);
      }
    },
  ];
}

export default storeTenant;
