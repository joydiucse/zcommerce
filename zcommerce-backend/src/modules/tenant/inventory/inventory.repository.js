import { scoped, scopedInsert } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery } from '../../../shared/helpers/index.js';
import { applyStockFilter } from '../products/product.repository.js';

export class InventoryRepository {
  async listProducts(query = {}) {
    const qb = scoped('products').select(
      'products.id',
      'products.name',
      'products.slug',
      'products.sku',
      'products.status',
      'products.images',
      'products.price',
      'products.track_inventory',
      'products.stock_quantity',
      'products.low_stock_threshold',
      'products.updated_at',
    );
    if (query.stock) applyStockFilter(qb, query.stock);
    if (query.status) qb.where('products.status', query.status);
    return paginateQuery(qb, query, {
      sortable: { stock_quantity: 'products.stock_quantity', name: 'products.name', sku: 'products.sku', updated_at: 'products.updated_at', created_at: 'products.created_at' },
      defaultSort: 'stock_quantity',
      defaultOrder: 'asc',
      searchColumns: ['products.name', 'products.sku'],
    });
  }

  lockProduct(id, trx) {
    return scoped('products', trx).where('products.id', id).forUpdate().first();
  }

  setStock(id, quantity, trx) {
    return scoped('products', trx).where('products.id', id).update({ stock_quantity: quantity, updated_at: db.fn.now() });
  }

  async addMovement(data, trx = null) {
    const [row] = await scopedInsert('inventory_movements', data, trx);
    return row;
  }

  async listMovements(query = {}) {
    const qb = scoped('inventory_movements')
      .leftJoin('products', 'products.id', 'inventory_movements.product_id')
      .leftJoin('users', 'users.id', 'inventory_movements.created_by')
      .select('inventory_movements.*', 'products.name as product_name', 'products.sku as product_sku', 'users.name as created_by_name');
    if (query.product_id) qb.where('inventory_movements.product_id', query.product_id);
    if (query.type) qb.where('inventory_movements.type', query.type);
    return paginateQuery(qb, query, {
      sortable: { created_at: 'inventory_movements.created_at', quantity: 'inventory_movements.quantity' },
      searchColumns: ['products.name', 'inventory_movements.reason', 'inventory_movements.reference'],
    });
  }
}
