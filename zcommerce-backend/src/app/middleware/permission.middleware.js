import { db } from '../database/connection.js';
import redisConfig from '../config/redis.config.js';
import appConfig from '../config/app.config.js';
import { cache } from '../../shared/utils/cache.js';
import { ForbiddenError, UnauthenticatedError } from '../../shared/exceptions/index.js';

/**
 * Does a permission list grant `required`? Supports the global `*` wildcard and
 * resource wildcards such as `products.*`.
 */
export function hasPermission(permissions = [], required) {
  if (!required) return true;
  if (!Array.isArray(permissions) || !permissions.length) return false;
  if (permissions.includes('*') || permissions.includes(required)) return true;
  const [resource] = String(required).split('.');
  return permissions.includes(`${resource}.*`);
}

const ROLE_TABLE = { system: 'system_roles', tenant: 'roles' };

/** Load a role's permissions (cached briefly in Redis at `perms:<scope>:<role_id>`). */
export async function loadRolePermissions(scope, roleId) {
  if (!roleId) return [];
  const perms = await cache.remember(redisConfig.keys.permissions(scope, roleId), appConfig.cacheTtl.permissions, async () => {
    const role = await db(ROLE_TABLE[scope]).select('permissions').where({ id: roleId }).first();
    return role ? role.permissions || [] : [];
  });
  return Array.isArray(perms) ? perms : [];
}

export const invalidateRolePermissions = (scope, roleId) => cache.del(redisConfig.keys.permissions(scope, roleId));

/** Route guard: `can('products.create')`. Accepts several keys (any of them grants access). */
export function can(...required) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthenticatedError());
    const perms = req.permissions || [];
    if (required.some((key) => hasPermission(perms, key))) return next();
    return next(new ForbiddenError(`Missing permission: ${required.join(' or ')}`));
  };
}

export default can;
