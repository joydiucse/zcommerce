import { scoped } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';

export class StoreCategoryRepository {
  /** Active categories with direct active-product counts. */
  allActive() {
    return scoped('categories')
      .where('categories.is_active', true)
      .select(
        'categories.id',
        'categories.parent_id',
        'categories.name',
        'categories.slug',
        'categories.description',
        'categories.image_url',
        'categories.sort_order',
        'categories.meta_title',
        'categories.meta_description',
        'categories.updated_at',
        db.raw(`(select count(*) from products p where p.category_id = categories.id and p.status = 'active')::int as direct_count`),
      )
      .orderBy('categories.sort_order')
      .orderBy('categories.name');
  }
}
