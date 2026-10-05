import { ok } from '../../../shared/helpers/response.js';

export class TenantPermissionController {
  constructor({ tenantPermissionService }) {
    this.list = async (_req, res) => ok(res, tenantPermissionService.list());
  }
}
