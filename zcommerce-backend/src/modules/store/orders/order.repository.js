import { scoped } from '../../../app/tenant/tenant-scope.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class StoreOrderRepository {
  listForCustomer(customerId, query = {}) {
    const qb = scoped('orders').where('orders.customer_id', customerId).select('orders.*');
    if (query.status) qb.where('orders.status', query.status);
    return paginateQuery(qb, query, { sortable: { placed_at: 'orders.placed_at', created_at: 'orders.created_at' }, defaultSort: 'placed_at' });
  }

  findByNumber(orderNumber) {
    return scoped('orders').where('orders.order_number', String(orderNumber)).first();
  }

  itemsFor(orderIds) {
    return orderIds.length ? scoped('order_items').whereIn('order_items.order_id', orderIds).orderBy('created_at') : [];
  }
}
