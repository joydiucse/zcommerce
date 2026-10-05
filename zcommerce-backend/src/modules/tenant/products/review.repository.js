import { TenantRepository, scoped } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

/** Review moderation (tenant side). Lives with products per the module layout. */
export class ReviewRepository extends TenantRepository {
  constructor() {
    super({ table: 'reviews' });
  }

  base() {
    return this.query()
      .leftJoin('products', 'products.id', 'reviews.product_id')
      .leftJoin('customers', 'customers.id', 'reviews.customer_id')
      .select('reviews.*', 'products.name as product_name', 'products.slug as product_slug', 'customers.email as customer_email');
  }

  async list(query = {}) {
    const qb = this.base();
    if (query.status) qb.where('reviews.status', query.status);
    if (query.product_id) qb.where('reviews.product_id', query.product_id);
    if (query.rating) qb.where('reviews.rating', Number(query.rating));
    return paginateQuery(qb, query, {
      sortable: { created_at: 'reviews.created_at', rating: 'reviews.rating', status: 'reviews.status' },
      searchColumns: ['reviews.title', 'reviews.body', 'reviews.author_name', 'products.name'],
    });
  }

  findById(id) {
    return this.base().where('reviews.id', id).first();
  }

  /** Recompute products.rating_avg / rating_count from approved reviews. */
  async recomputeRating(productId, trx = null) {
    const stats = await scoped('reviews', trx)
      .where({ product_id: productId, status: 'approved' })
      .select(db.raw('coalesce(avg(rating), 0) as avg'), db.raw('count(*)::int as count'))
      .first();
    await scoped('products', trx)
      .where('products.id', productId)
      .update({ rating_avg: Math.round(Number(stats.avg) * 100) / 100, rating_count: stats.count });
  }
}
