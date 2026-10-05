import { withTransaction } from '../../../app/database/transaction.js';
import { getTenantId } from '../../../app/tenant/tenant-context.js';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/index.js';

export class InventoryService {
  constructor({ inventoryRepository, notificationService, settingService }) {
    this.repo = inventoryRepository;
    this.notifications = notificationService;
    this.settings = settingService;
  }

  async listProducts(query) {
    const { data, meta } = await this.repo.listProducts(query);
    return {
      data: data.map((p) => ({
        ...p,
        image_url: p.images?.[0]?.url || null,
        stock_status: !p.track_inventory || p.stock_quantity > p.low_stock_threshold ? 'in' : p.stock_quantity <= 0 ? 'out' : 'low',
      })),
      meta,
    };
  }

  async listMovements(query) {
    const { data, meta } = await this.repo.listMovements(query);
    return {
      data: data.map(({ product_name, product_sku, created_by_name, ...m }) => ({
        ...m,
        product: { id: m.product_id, name: product_name, sku: product_sku },
        created_by_name: created_by_name || null,
      })),
      meta,
    };
  }

  /**
   * Create a stock.low notification when stock crosses the threshold (before > threshold >= after).
   * Call inside the same transaction as the stock change.
   */
  async checkLowStock(product, before, after, trx) {
    if (!product.track_inventory) return;
    const threshold = product.low_stock_threshold ?? 5;
    if (!(before > threshold && after <= threshold)) return;
    const { low_stock_alerts } = await this.settings.getGroup(getTenantId(), 'notifications');
    if (!low_stock_alerts) return;
    await this.notifications.notify(
      {
        type: 'stock.low',
        title: after <= 0 ? `Out of stock: ${product.name}` : `Low stock: ${product.name}`,
        body: `${product.name}${product.sku ? ` (${product.sku})` : ''} has ${after} left in stock.`,
        data: { product_id: product.id, stock_quantity: after, threshold },
      },
      trx,
    );
  }

  async adjust({ product_id, quantity, type, reason }, user) {
    return withTransaction(async (trx) => {
      const product = await this.repo.lockProduct(product_id, trx);
      if (!product) throw new NotFoundError('Product not found');
      const next = product.stock_quantity + quantity;
      if (next < 0) throw ValidationError.field('quantity', `Stock cannot go below zero (current stock: ${product.stock_quantity})`);
      await this.repo.setStock(product.id, next, trx);
      const movement = await this.repo.addMovement(
        { product_id: product.id, type, quantity, reason: reason || null, reference: null, created_by: user?.id || null },
        trx,
      );
      await this.checkLowStock(product, product.stock_quantity, next, trx);
      return { product_id: product.id, previous_quantity: product.stock_quantity, stock_quantity: next, movement };
    });
  }
}
