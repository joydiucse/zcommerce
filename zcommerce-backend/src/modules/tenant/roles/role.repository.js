import { TenantRepository } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class TenantRoleRepository extends TenantRepository {
  constructor() {
    super({ table: 'roles', jsonColumns: ['permissions'] });
  }

  base() {
    return this.query().select('roles.*', db.raw('(select count(*) from users u where u.role_id = roles.id)::int as users_count'));
  }

  async list(query = {}) {
    if (query.all === 'true') {
      const data = await this.base().orderBy('roles.name');
      return { data, meta: { page: 1, limit: data.length || 1, total: data.length, total_pages: 1 } };
    }
    return paginateQuery(this.base(), query, {
      sortable: { created_at: 'roles.created_at', name: 'roles.name' },
      defaultSort: 'name',
      defaultOrder: 'asc',
      searchColumns: ['roles.name'],
    });
  }

  findById(id) {
    return this.base().where('roles.id', id).first();
  }
}
