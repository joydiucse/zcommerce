import { db } from '../../../app/database/connection.js';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/exceptions/index.js';
import { round2 } from '../../../shared/utils/index.js';

export class BillingService {
  constructor({ invoiceRepository, auditLogService }) {
    this.repo = invoiceRepository;
    this.audit = auditLogService;
  }

  present(row) {
    const { tenant_name, tenant_slug, ...inv } = row;
    return { ...inv, tenant: { id: inv.tenant_id, name: tenant_name, slug: tenant_slug } };
  }

  async list(query) {
    const { data, meta } = await this.repo.list(query);
    return { data: data.map((r) => this.present(r)), meta };
  }

  async get(id) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Invoice not found');
    return this.present(row);
  }

  async create(data, req) {
    const tenant = await db('tenants').where({ id: data.tenant_id }).first();
    if (!tenant) throw ValidationError.field('tenant_id', 'Tenant not found');
    const items = (data.items || []).map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unit_price: round2(i.unit_price),
      amount: round2(i.quantity * i.unit_price),
    }));
    const amount = data.amount ?? round2(items.reduce((s, i) => s + i.amount, 0));
    const row = await this.repo.create({
      tenant_id: tenant.id,
      subscription_id: data.subscription_id || null,
      number: await this.repo.nextNumber(),
      amount,
      currency: data.currency || 'USD',
      status: data.status || 'open',
      due_date: data.due_date || new Date(Date.now() + 14 * 86400000),
      items,
    });
    await this.audit.record(req, { action: 'invoice.created', entity_type: 'invoice', entity_id: row.id, tenant_id: tenant.id, changes: { number: row.number, amount } });
    return this.get(row.id);
  }

  async markPaid(id, req) {
    const inv = await this.repo.findById(id);
    if (!inv) throw new NotFoundError('Invoice not found');
    if (inv.status === 'void') throw new ConflictError('A void invoice cannot be marked as paid');
    if (inv.status !== 'paid') await this.repo.update(id, { status: 'paid', paid_at: new Date() });
    await this.audit.record(req, { action: 'invoice.marked_paid', entity_type: 'invoice', entity_id: id, tenant_id: inv.tenant_id, changes: { number: inv.number, amount: inv.amount } });
    return this.get(id);
  }

  async void(id, req) {
    const inv = await this.repo.findById(id);
    if (!inv) throw new NotFoundError('Invoice not found');
    if (inv.status === 'paid') throw new ConflictError('A paid invoice cannot be voided');
    await this.repo.update(id, { status: 'void' });
    await this.audit.record(req, { action: 'invoice.voided', entity_type: 'invoice', entity_id: id, tenant_id: inv.tenant_id, changes: { number: inv.number } });
    return this.get(id);
  }
}
