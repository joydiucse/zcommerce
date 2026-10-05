import { scoped } from '../../../app/tenant/tenant-scope.js';

export class SearchRepository {
  categories(term, limit) {
    return scoped('categories')
      .where('categories.is_active', true)
      .whereILike('categories.name', `%${term}%`)
      .select('id', 'name', 'slug', 'image_url')
      .orderBy('name')
      .limit(limit);
  }

  brands(term, limit) {
    return scoped('brands')
      .where('brands.is_active', true)
      .whereILike('brands.name', `%${term}%`)
      .select('id', 'name', 'slug', 'logo_url')
      .orderBy('name')
      .limit(limit);
  }
}
