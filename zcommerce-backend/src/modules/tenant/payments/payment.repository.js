import { TenantRepository } from '../../../app/tenant/tenant-scope.js';
import { paginateQuery, applyDateRange } from '../../../shared/helpers/index.js';

export class PaymentRepository extends TenantRepository {
  constructor() {
    super({ table: 'payments' });
  }

  async list(query = {}) {
    const qb = this.query()
      .leftJoin('orders', 'orders.id', 'payments.order_id')
      .select('payments.*', 'orders.order_number', 'orders.email as order_email', 'orders.status as order_status');
    if (query.status) qb.where('payments.status', query.status);
    if (query.method) qb.where('payments.method', query.method);
    applyDateRange(qb, 'payments.created_at', query.from, query.to);
    return paginateQuery(qb, query, {
      sortable: { created_at: 'payments.created_at', amount: 'payments.amount', paid_at: 'payments.paid_at', status: 'payments.status' },
      searchColumns: ['orders.order_number', 'orders.email', 'payments.transaction_ref'],
    });
  }
}
