import { ok } from '../../../shared/helpers/response.js';

export class AuditLogController {
  constructor({ auditLogService }) {
    this.list = async (req, res) => {
      const { data, meta } = await auditLogService.list(req.query);
      return ok(res, data, meta);
    };
  }
}
