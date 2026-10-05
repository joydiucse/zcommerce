import { AsyncLocalStorage } from 'node:async_hooks';
import { AppError } from '../../shared/exceptions/index.js';

/**
 * Per-request tenant context. Middleware calls `runWithTenant(tenant, next)`; anything awaited
 * downstream (services, repositories) can read the current tenant without passing it around.
 */
const storage = new AsyncLocalStorage();

export function runWithTenant(tenant, fn, extra = {}) {
  return storage.run({ tenant, ...extra }, fn);
}

export const getContext = () => storage.getStore() || null;

export const getTenant = () => storage.getStore()?.tenant || null;

/** Current tenant id; throws if called outside a tenant-scoped request (programming error). */
export function getTenantId() {
  const tenant = getTenant();
  if (!tenant) throw new AppError('Tenant context is missing', { status: 500, code: 'INTERNAL_ERROR' });
  return tenant.id;
}

export const tenantContext = { run: runWithTenant, get: getContext, getTenant, getTenantId };
export default tenantContext;
