import { scoped } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';

export class SettingRepository {
  /** Stored groups for a tenant as { group: value }. */
  async getAll(tenantId) {
    const rows = await scoped('tenant_settings', null, tenantId).select('group', 'value');
    return Object.fromEntries(rows.map((r) => [r.group, r.value]));
  }

  async upsert(tenantId, group, value) {
    const [row] = await db('tenant_settings')
      .insert({ tenant_id: tenantId, group, value: JSON.stringify(value) })
      .onConflict(['tenant_id', 'group'])
      .merge({ value: JSON.stringify(value), updated_at: db.fn.now() })
      .returning('*');
    return row.value;
  }
}
