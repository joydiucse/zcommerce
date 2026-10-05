import { TenantRepository } from '../../../app/tenant/tenant-scope.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class TenantUserRepository extends TenantRepository {
  constructor() {
    super({ table: 'users' });
  }

  base() {
    return this.query().leftJoin('roles', 'roles.id', 'users.role_id').select('users.*', 'roles.name as role_name');
  }

  async list(query = {}) {
    const qb = this.base();
    if (query.status) qb.where('users.status', query.status);
    if (query.role_id) qb.where('users.role_id', query.role_id);
    return paginateQuery(qb, query, {
      sortable: { created_at: 'users.created_at', name: 'users.name', email: 'users.email', last_login_at: 'users.last_login_at' },
      searchColumns: ['users.name', 'users.email'],
    });
  }

  findById(id) {
    return this.base().where('users.id', id).first();
  }
}
