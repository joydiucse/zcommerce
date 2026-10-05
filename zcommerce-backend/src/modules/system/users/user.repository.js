import { GlobalRepository } from '../../../app/tenant/tenant-scope.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class SystemUserRepository extends GlobalRepository {
  constructor() {
    super({ table: 'system_users' });
  }

  base() {
    return this.query()
      .leftJoin('system_roles', 'system_roles.id', 'system_users.role_id')
      .select('system_users.*', 'system_roles.name as role_name');
  }

  async list(query = {}) {
    const qb = this.base();
    if (query.status) qb.where('system_users.status', query.status);
    if (query.role_id) qb.where('system_users.role_id', query.role_id);
    return paginateQuery(qb, query, {
      sortable: { created_at: 'system_users.created_at', name: 'system_users.name', email: 'system_users.email', last_login_at: 'system_users.last_login_at' },
      searchColumns: ['system_users.name', 'system_users.email'],
    });
  }

  findById(id) {
    return this.base().where('system_users.id', id).first();
  }
}
