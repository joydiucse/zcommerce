import { scoped } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';

export class CheckoutRepository {
  activeShippingMethods(trx = null) {
    return scoped('shipping_methods', trx).where('shipping_methods.is_active', true).orderBy('sort_order').orderBy('rate');
  }

  shippingMethod(id, trx = null) {
    return scoped('shipping_methods', trx).where({ 'shipping_methods.id': id, 'shipping_methods.is_active': true }).first();
  }

  decrementStock(productId, quantity, trx) {
    return scoped('products', trx)
      .where('products.id', productId)
      .update({ stock_quantity: db.raw('stock_quantity - ?', [quantity]), updated_at: db.fn.now() });
  }

  recordCustomerOrder(customerId, amount, trx) {
    return scoped('customers', trx)
      .where('customers.id', customerId)
      .update({
        orders_count: db.raw('orders_count + 1'),
        total_spent: db.raw('total_spent + ?', [amount]),
        last_order_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
  }
}
