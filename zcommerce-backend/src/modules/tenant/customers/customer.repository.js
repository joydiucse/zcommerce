import { TenantRepository, scoped } from '../../../app/tenant/tenant-scope.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class CustomerRepository extends TenantRepository {
  constructor() {
    super({ table: 'customers', jsonColumns: ['addresses'] });
  }

  async list(query = {}) {
    const qb = this.query().select('customers.*');
    if (query.status) qb.where('customers.status', query.status);
    if (query.accepts_marketing !== undefined) qb.where('customers.accepts_marketing', query.accepts_marketing === true || query.accepts_marketing === 'true');
    if (query.has_account !== undefined) {
      if (query.has_account === true || query.has_account === 'true') qb.whereNotNull('customers.password_hash');
      else qb.whereNull('customers.password_hash');
    }
    return paginateQuery(qb, query, {
      sortable: {
        created_at: 'customers.created_at',
        name: 'customers.name',
        email: 'customers.email',
        orders_count: 'customers.orders_count',
        total_spent: 'customers.total_spent',
        last_order_at: 'customers.last_order_at',
      },
      searchColumns: ['customers.name', 'customers.email', 'customers.phone'],
    });
  }

  findByEmail(email, trx = null) {
    return this.query(trx).whereRaw('lower(customers.email) = ?', [String(email).toLowerCase()]).first();
  }

  recentOrders(customerId, limit = 5) {
    return scoped('orders')
      .where('orders.customer_id', customerId)
      .select('id', 'order_number', 'status', 'payment_status', 'grand_total', 'currency', 'placed_at', 'created_at')
      .orderBy('placed_at', 'desc')
      .limit(limit);
  }
}
