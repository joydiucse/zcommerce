import { TenantRepository, scoped, scopedInsert } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery, applyDateRange } from '../../../shared/helpers/index.js';
import { getTenantId } from '../../../app/tenant/tenant-context.js';
import { ORDER_NUMBER_START } from '../../../shared/constants/index.js';

export const ORDER_JSON = ['shipping_address', 'billing_address'];

export class OrderRepository extends TenantRepository {
  constructor() {
    super({ table: 'orders', jsonColumns: ORDER_JSON });
  }

  base(trx = null) {
    return this.query(trx)
      .leftJoin('customers', 'customers.id', 'orders.customer_id')
      .select(
        'orders.*',
        'customers.name as customer_name',
        db.raw('(select coalesce(sum(oi.quantity), 0)::int from order_items oi where oi.order_id = orders.id) as items_count'),
      );
  }

  async list(query = {}) {
    const qb = this.base();
    if (query.status) qb.where('orders.status', query.status);
    if (query.payment_status) qb.where('orders.payment_status', query.payment_status);
    if (query.fulfillment_status) qb.where('orders.fulfillment_status', query.fulfillment_status);
    if (query.customer_id) qb.where('orders.customer_id', query.customer_id);
    applyDateRange(qb, 'orders.placed_at', query.from, query.to);
    return paginateQuery(qb, query, {
      sortable: {
        created_at: 'orders.created_at',
        placed_at: 'orders.placed_at',
        grand_total: 'orders.grand_total',
        order_number: db.raw('orders.order_number::int'),
        status: 'orders.status',
      },
      searchColumns: ['orders.order_number', 'orders.email', 'customers.name', 'orders.phone'],
    });
  }

  findById(id, trx = null) {
    return this.base(trx).where('orders.id', id).first();
  }

  findByNumber(orderNumber) {
    return this.base().where('orders.order_number', String(orderNumber)).first();
  }

  items(orderId, trx = null) {
    return scoped('order_items', trx).where('order_items.order_id', orderId).orderBy('created_at');
  }

  history(orderId) {
    return scoped('order_status_history')
      .leftJoin('users', 'users.id', 'order_status_history.created_by')
      .where('order_status_history.order_id', orderId)
      .select('order_status_history.*', 'users.name as created_by_name')
      .orderBy('order_status_history.created_at', 'asc');
  }

  payments(orderId, trx = null) {
    return scoped('payments', trx).where('payments.order_id', orderId).orderBy('created_at');
  }

  customer(customerId) {
    return customerId
      ? scoped('customers').where('customers.id', customerId).first('id', 'name', 'email', 'phone', 'orders_count', 'total_spent')
      : null;
  }

  /** Next per-tenant order number (serialised by a transaction-scoped advisory lock). */
  async nextOrderNumber(trx) {
    const tenantId = getTenantId();
    await trx.raw('select pg_advisory_xact_lock(hashtext(?))', [`order_number:${tenantId}`]);
    const row = await scoped('orders', trx)
      .select(db.raw('max(order_number::int) as max'))
      .first();
    return String(Math.max(Number(row?.max || 0) + 1, ORDER_NUMBER_START));
  }

  async insertOrder(data, trx) {
    return this.create(data, trx);
  }

  insertItems(items, trx) {
    return scopedInsert('order_items', items, trx);
  }

  addHistory(data, trx = null) {
    return scopedInsert('order_status_history', data, trx);
  }

  addPayment(data, trx) {
    return scopedInsert('payments', data, trx);
  }

  updatePayments(orderId, data, trx) {
    return scoped('payments', trx).where('payments.order_id', orderId).update({ ...data, updated_at: db.fn.now() });
  }
}
