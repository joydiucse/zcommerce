import { db } from '../../../app/database/connection.js';
import { scoped } from '../../../app/tenant/tenant-scope.js';

/** Login runs before a tenant context exists, so tenant ids are passed explicitly. */
export class TenantAuthRepository {
  findUserByEmail(tenantId, email) {
    return scoped('users', null, tenantId).whereRaw('lower(email) = ?', [String(email).toLowerCase()]).first();
  }

  findUserById(tenantId, id) {
    return scoped('users', null, tenantId).where('users.id', id).first();
  }

  findRole(tenantId, roleId) {
    return roleId ? scoped('roles', null, tenantId).select('id', 'name', 'permissions').where('roles.id', roleId).first() : null;
  }

  touchLogin(tenantId, id) {
    return scoped('users', null, tenantId).where('users.id', id).update({ last_login_at: db.fn.now() });
  }

  updateUser(tenantId, id, data) {
    return scoped('users', null, tenantId)
      .where('users.id', id)
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
  }
}
