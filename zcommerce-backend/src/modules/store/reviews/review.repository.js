import { scoped, scopedInsert } from '../../../app/tenant/tenant-scope.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class StoreReviewRepository {
  findActiveProduct(slug) {
    return scoped('products').where({ 'products.slug': slug, 'products.status': 'active' }).first('id', 'name', 'rating_avg', 'rating_count');
  }

  approved(productId, query = {}) {
    const qb = scoped('reviews')
      .where({ 'reviews.product_id': productId, 'reviews.status': 'approved' })
      .select('reviews.id', 'reviews.author_name', 'reviews.rating', 'reviews.title', 'reviews.body', 'reviews.created_at');
    return paginateQuery(qb, query, {
      sortable: { created_at: 'reviews.created_at', rating: 'reviews.rating' },
    });
  }

  async create(data) {
    const [row] = await scopedInsert('reviews', data);
    return row;
  }
}
