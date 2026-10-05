import { db } from '../database/connection.js';
import { authenticate } from './auth.middleware.js';
import { loadRolePermissions } from './permission.middleware.js';
import { UnauthenticatedError } from '../../shared/exceptions/index.js';

/** Requires an access token with aud=system and an active system user. Sets req.user / req.permissions. */
export function requireSystemAuth() {
  const verify = authenticate('system');
  return [
    verify,
    async (req, _res, next) => {
      try {
        const user = await db('system_users').where({ id: req.auth.sub }).first();
        if (!user || user.status !== 'active') throw new UnauthenticatedError('Account is disabled or no longer exists');
        delete user.password_hash;
        req.user = user;
        req.actor = { type: 'system', id: user.id };
        req.permissions = await loadRolePermissions('system', user.role_id);
        next();
      } catch (err) {
        next(err);
      }
    },
  ];
}

export default requireSystemAuth;
