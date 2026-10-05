import { ok } from '../../../shared/helpers/response.js';

export class SystemPermissionController {
  constructor({ systemPermissionService }) {
    this.list = async (_req, res) => ok(res, systemPermissionService.list());
  }
}
