import { TenantRepository } from '../../../app/tenant/tenant-scope.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

/** CMS pages (tenant side). Lives with settings per the module layout. */
export class PageRepository extends TenantRepository {
  constructor() {
    super({ table: 'pages' });
  }

  async list(query = {}) {
    const qb = this.query().select('pages.*');
    if (query.is_published !== undefined) qb.where('pages.is_published', query.is_published === true || query.is_published === 'true');
    return paginateQuery(qb, query, {
      sortable: { created_at: 'pages.created_at', updated_at: 'pages.updated_at', title: 'pages.title' },
      searchColumns: ['pages.title', 'pages.slug'],
    });
  }
}
