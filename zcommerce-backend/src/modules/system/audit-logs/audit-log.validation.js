import { z, listQuery, uuid } from '../../../shared/validators/index.js';

export const listAuditLogsSchema = {
  query: listQuery.extend({
    actor_type: z.enum(['system', 'tenant']).optional(),
    tenant_id: uuid.optional(),
    action: z.string().max(100).optional(),
    from: z.string().max(40).optional(),
    to: z.string().max(40).optional(),
  }),
};
