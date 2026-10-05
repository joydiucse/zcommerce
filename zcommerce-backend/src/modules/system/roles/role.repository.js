import { GlobalRepository } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class SystemRoleRepository extends GlobalRepository {
  constructor() {
    super({ table: 'system_roles', jsonColumns: ['permissions'] });
  }

  base() {
    return this.query().select(
      'system_roles.*',
      db.raw('(select count(*) from system_users u where u.role_id = system_roles.id)::int as users_count'),
    );
  }

  async list(query = {}) {
    if (query.all === 'true' || query.all === true) {
      const data = await this.base().orderBy('name');
      return { data, meta: { page: 1, limit: data.length, total: data.length, total_pages: 1 } };
    }
    return paginateQuery(this.base(), query, {
      sortable: { created_at: 'system_roles.created_at', name: 'system_roles.name' },
      defaultSort: 'name',
      defaultOrder: 'asc',
      searchColumns: ['system_roles.name'],
    });
  }

  findById(id) {
    return this.base().where('system_roles.id', id).first();
  }
}
