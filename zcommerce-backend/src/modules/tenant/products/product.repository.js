import { TenantRepository, scoped, scopedInsert } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export const PRODUCT_JSON = ['images', 'attributes', 'tags'];

/** Apply ?stock=in|low|out on the products table. */
export function applyStockFilter(qb, stock) {
  if (stock === 'out') qb.where('products.track_inventory', true).where('products.stock_quantity', '<=', 0);
  else if (stock === 'low')
    qb.where('products.track_inventory', true)
      .where('products.stock_quantity', '>', 0)
      .whereRaw('products.stock_quantity <= products.low_stock_threshold');
  else if (stock === 'in') qb.where((b) => b.where('products.track_inventory', false).orWhere('products.stock_quantity', '>', 0));
  return qb;
}

export class ProductRepository extends TenantRepository {
  constructor() {
    super({ table: 'products', jsonColumns: PRODUCT_JSON });
  }

  base(trx = null) {
    return this.query(trx)
      .leftJoin('categories', 'categories.id', 'products.category_id')
      .leftJoin('brands', 'brands.id', 'products.brand_id')
      .select('products.*', 'categories.name as category_name', 'categories.slug as category_slug', 'brands.name as brand_name', 'brands.slug as brand_slug');
  }

  async list(query = {}) {
    const qb = this.base();
    if (query.status) qb.where('products.status', query.status);
    if (query.category_id) qb.where('products.category_id', query.category_id);
    if (query.brand_id) qb.where('products.brand_id', query.brand_id);
    if (query.is_featured !== undefined) qb.where('products.is_featured', query.is_featured === true || query.is_featured === 'true');
    if (query.stock) applyStockFilter(qb, query.stock);
    return paginateQuery(qb, query, {
      sortable: {
        created_at: 'products.created_at',
        updated_at: 'products.updated_at',
        name: 'products.name',
        price: 'products.price',
        stock_quantity: 'products.stock_quantity',
        status: 'products.status',
        sku: 'products.sku',
        rating_avg: 'products.rating_avg',
      },
      searchColumns: ['products.name', 'products.sku'],
    });
  }

  findById(id, trx = null) {
    return this.base(trx).where('products.id', id).first();
  }

  categoryExists(id) {
    return scoped('categories').where('categories.id', id).first('id');
  }

  brandExists(id) {
    return scoped('brands').where('brands.id', id).first('id');
  }

  async bulk(ids, action) {
    const qb = this.query().whereIn('products.id', ids);
    if (action === 'delete') return qb.del();
    if (action === 'activate') {
      return qb.update({ status: 'active', published_at: db.raw('coalesce(published_at, now())'), updated_at: db.fn.now() });
    }
    return qb.update({ status: 'archived', updated_at: db.fn.now() });
  }

  addMovement(data, trx = null) {
    return scopedInsert('inventory_movements', data, trx);
  }
}
