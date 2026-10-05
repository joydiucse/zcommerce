import { db } from '../../../app/database/connection.js';
import { scoped } from '../../../app/tenant/tenant-scope.js';

export class StorefrontRepository {
  async sitemap() {
    const [products, categories, brands, pages] = await Promise.all([
      scoped('products').where('status', 'active').select('slug', 'updated_at').orderBy('updated_at', 'desc'),
      scoped('categories').where('is_active', true).select('slug', 'updated_at').orderBy('name'),
      scoped('brands').where('is_active', true).select('slug', 'updated_at').orderBy('name'),
      scoped('pages').where('is_published', true).select('slug', 'updated_at').orderBy('title'),
    ]);
    return { products, categories, brands, pages };
  }

  /** Public plan list for the platform landing page (not tenant-scoped). */
  activePlans() {
    return db('plans')
      .where('is_active', true)
      .select('name', 'slug', 'description', 'price_monthly', 'price_yearly', 'currency', 'features')
      .orderBy([{ column: 'sort_order' }, { column: 'price_monthly' }]);
  }
}
