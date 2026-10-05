import { scoped } from '../../../app/tenant/tenant-scope.js';
import { getTenantId } from '../../../app/tenant/tenant-context.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export const STORE_LIST_COLUMNS = [
  'products.id',
  'products.name',
  'products.slug',
  'products.sku',
  'products.short_description',
  'products.price',
  'products.compare_at_price',
  'products.images',
  'products.category_id',
  'products.brand_id',
  'products.track_inventory',
  'products.stock_quantity',
  'products.is_featured',
  'products.rating_avg',
  'products.rating_count',
  'products.published_at',
  'products.created_at',
  'products.updated_at',
  'categories.name as category_name',
  'categories.slug as category_slug',
  'brands.name as brand_name',
  'brands.slug as brand_slug',
];

const DETAIL_EXTRA = ['products.description', 'products.attributes', 'products.tags', 'products.meta_title', 'products.meta_description', 'products.weight'];

/** Public sort keys -> SQL. */
export const STORE_SORTS = {
  newest: db.raw('coalesce(products.published_at, products.created_at)'),
  price_asc: 'products.price',
  price_desc: 'products.price',
  name: 'products.name',
  popular: 'products.rating_count',
};
const SORT_ORDER = { newest: 'desc', price_asc: 'asc', price_desc: 'desc', name: 'asc', popular: 'desc' };

export class StoreProductRepository {
  /** Active products with category/brand joined (tenant-scoped). */
  base() {
    return scoped('products')
      .where('products.status', 'active')
      .leftJoin('categories', 'categories.id', 'products.category_id')
      .leftJoin('brands', 'brands.id', 'products.brand_id');
  }

  /** Category id + all descendant ids for a slug (so parent categories include child products). */
  async categoryTreeIds(slug) {
    const { rows } = await db.raw(
      `with recursive tree as (
         select id from categories where tenant_id = ? and slug = ? and is_active = true
         union all
         select c.id from categories c join tree t on c.parent_id = t.id where c.is_active = true
       ) select id from tree`,
      [getTenantId(), slug],
    );
    return rows.map((r) => r.id);
  }

  async list(query = {}) {
    const qb = this.base().select(STORE_LIST_COLUMNS);
    if (query.category) {
      const ids = await this.categoryTreeIds(query.category);
      if (!ids.length) qb.whereRaw('false');
      else qb.whereIn('products.category_id', ids);
    }
    if (query.brand) qb.where('brands.slug', query.brand);
    if (query.min_price !== undefined) qb.where('products.price', '>=', query.min_price);
    if (query.max_price !== undefined) qb.where('products.price', '<=', query.max_price);
    if (query.featured === true || query.featured === 'true') qb.where('products.is_featured', true);
    if (query.in_stock === true || query.in_stock === 'true') {
      qb.where((b) => b.where('products.track_inventory', false).orWhere('products.stock_quantity', '>', 0));
    }
    const sortKey = STORE_SORTS[query.sort] ? query.sort : 'newest';
    return paginateQuery(
      qb,
      { ...query, sort: sortKey, order: SORT_ORDER[sortKey] },
      {
        sortable: STORE_SORTS,
        defaultSort: 'newest',
        searchColumns: ['products.name', 'products.sku', 'products.short_description'],
      },
    );
  }

  findBySlug(slug) {
    return this.base()
      .select([...STORE_LIST_COLUMNS, ...DETAIL_EXTRA])
      .where('products.slug', slug)
      .first();
  }

  related(product, limit = 4) {
    const qb = this.base().select(STORE_LIST_COLUMNS).whereNot('products.id', product.id);
    if (product.category_id) qb.where('products.category_id', product.category_id);
    return qb.orderBy('products.rating_count', 'desc').orderBy('products.published_at', 'desc').limit(limit);
  }

  search(term, limit) {
    const like = `%${term}%`;
    return this.base()
      .select(STORE_LIST_COLUMNS)
      .where((b) =>
        b
          .whereILike('products.name', like)
          .orWhereILike('products.sku', like)
          .orWhereILike('products.short_description', like)
          .orWhereRaw('products.tags::text ilike ?', [like]),
      )
      .orderByRaw('case when products.name ilike ? then 0 else 1 end', [`${term}%`])
      .orderBy('products.rating_count', 'desc')
      .limit(limit);
  }

  /** Products by id (active only) — used by cart/checkout. */
  byIds(ids, trx = null, { lock = false } = {}) {
    const qb = scoped('products', trx).whereIn('products.id', ids).select('products.*');
    return lock ? qb.forUpdate() : qb;
  }
}
