import { GlobalRepository } from '../../../app/tenant/tenant-scope.js';
import { paginateQuery, applyDateRange } from '../../../shared/helpers/index.js';

export class AuditLogRepository extends GlobalRepository {
  constructor() {
    super({ table: 'audit_logs', jsonColumns: ['changes'] });
  }

  async list(query = {}) {
    const qb = this.query()
      .leftJoin('tenants', 'tenants.id', 'audit_logs.tenant_id')
      .select('audit_logs.*', 'tenants.name as tenant_name', 'tenants.slug as tenant_slug');
    if (query.actor_type) qb.where('audit_logs.actor_type', query.actor_type);
    if (query.tenant_id) qb.where('audit_logs.tenant_id', query.tenant_id);
    if (query.action) qb.whereILike('audit_logs.action', `${query.action}%`);
    applyDateRange(qb, 'audit_logs.created_at', query.from, query.to);
    return paginateQuery(qb, query, {
      sortable: { created_at: 'audit_logs.created_at', action: 'audit_logs.action' },
      searchColumns: ['audit_logs.action', 'audit_logs.entity_type'],
    });
  }
}
