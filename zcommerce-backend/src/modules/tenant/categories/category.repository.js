import { TenantRepository } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { getTenantId } from '../../../app/tenant/tenant-context.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class CategoryRepository extends TenantRepository {
  constructor() {
    super({ table: 'categories' });
  }

  base() {
    return this.query()
      .leftJoin('categories as parent', 'parent.id', 'categories.parent_id')
      .select(
        'categories.*',
        'parent.name as parent_name',
        db.raw('(select count(*) from products p where p.category_id = categories.id)::int as products_count'),
      );
  }

  async list(query = {}) {
    const qb = this.base();
    if (query.parent_id === 'null' || query.parent_id === 'root') qb.whereNull('categories.parent_id');
    else if (query.parent_id) qb.where('categories.parent_id', query.parent_id);
    if (query.is_active !== undefined) qb.where('categories.is_active', query.is_active === true || query.is_active === 'true');
    return paginateQuery(qb, query, {
      sortable: { created_at: 'categories.created_at', name: 'categories.name', sort_order: 'categories.sort_order', products_count: 'products_count' },
      searchColumns: ['categories.name', 'categories.slug'],
    });
  }

  all() {
    return this.base().orderBy('categories.sort_order').orderBy('categories.name');
  }

  findById(id) {
    return this.base().where('categories.id', id).first();
  }

  /** All descendant ids of a category (used to prevent parent cycles). */
  async descendantIds(id) {
    const { rows } = await db.raw(
      `with recursive tree as (
         select id from categories where parent_id = ? and tenant_id = ?
         union all
         select c.id from categories c join tree t on c.parent_id = t.id
       ) select id from tree`,
      [id, getTenantId()],
    );
    return rows.map((r) => r.id);
  }
}
