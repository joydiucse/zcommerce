import { scoped } from '../../../app/tenant/tenant-scope.js';

export class StorePageRepository {
  published() {
    return scoped('pages').where('pages.is_published', true).select('title', 'slug', 'show_in_footer', 'updated_at').orderBy('title');
  }

  findBySlug(slug) {
    return scoped('pages')
      .where({ 'pages.slug': slug, 'pages.is_published': true })
      .select('id', 'title', 'slug', 'content', 'show_in_footer', 'meta_title', 'meta_description', 'created_at', 'updated_at')
      .first();
  }
}
