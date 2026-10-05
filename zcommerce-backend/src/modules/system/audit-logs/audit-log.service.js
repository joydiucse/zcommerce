import { logger } from '../../../shared/utils/logger.js';

export class AuditLogService {
  constructor({ auditLogRepository }) {
    this.repo = auditLogRepository;
  }

  async list(query) {
    const { data, meta } = await this.repo.list(query);
    return {
      data: data.map(({ tenant_name, tenant_slug, ...row }) => ({
        ...row,
        tenant: row.tenant_id ? { id: row.tenant_id, name: tenant_name, slug: tenant_slug } : null,
      })),
      meta,
    };
  }

  /**
   * Record an audit entry. Never throws (auditing must not break the action itself).
   * @param {object} req express request (for actor/ip/user agent); may be null
   */
  async record(req, { action, entity_type = null, entity_id = null, tenant_id = null, changes = null }, trx = null) {
    try {
      const actor = req?.actor || { type: 'system', id: null };
      await this.repo.create(
        {
          actor_type: actor.type,
          actor_id: actor.id,
          tenant_id,
          action,
          entity_type,
          entity_id,
          changes,
          ip: req?.ip || null,
          user_agent: req?.get?.('user-agent') || null,
        },
        trx,
      );
    } catch (err) {
      logger.error({ err: err.message, action }, 'Failed to write audit log');
    }
  }
}
