import { GlobalRepository } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery, applyDateRange } from '../../../shared/helpers/index.js';

export class InvoiceRepository extends GlobalRepository {
  constructor() {
    super({ table: 'invoices', jsonColumns: ['items'] });
  }

  base() {
    return this.query()
      .leftJoin('tenants', 'tenants.id', 'invoices.tenant_id')
      .select('invoices.*', 'tenants.name as tenant_name', 'tenants.slug as tenant_slug');
  }

  async list(query = {}) {
    const qb = this.base();
    if (query.status) qb.where('invoices.status', query.status);
    if (query.tenant_id) qb.where('invoices.tenant_id', query.tenant_id);
    applyDateRange(qb, 'invoices.created_at', query.from, query.to);
    return paginateQuery(qb, query, {
      sortable: { created_at: 'invoices.created_at', number: 'invoices.number', amount: 'invoices.amount', due_date: 'invoices.due_date', status: 'invoices.status' },
      searchColumns: ['invoices.number', 'tenants.name'],
    });
  }

  findById(id) {
    return this.base().where('invoices.id', id).first();
  }

  async nextNumber(trx = null) {
    const { rows } = await (trx || db).raw(`select nextval('invoice_number_seq')::int as n`);
    return `INV-${String(rows[0].n).padStart(6, '0')}`;
  }
}
