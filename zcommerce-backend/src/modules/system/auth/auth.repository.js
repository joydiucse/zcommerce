import { db } from '../../../app/database/connection.js';

export class SystemAuthRepository {
  findUserByEmail(email) {
    return db('system_users').whereRaw('lower(email) = ?', [String(email).toLowerCase()]).first();
  }

  findUserById(id) {
    return db('system_users').where({ id }).first();
  }

  findRole(id) {
    return id ? db('system_roles').select('id', 'name', 'permissions').where({ id }).first() : null;
  }

  touchLogin(id) {
    return db('system_users').where({ id }).update({ last_login_at: db.fn.now() });
  }
}
