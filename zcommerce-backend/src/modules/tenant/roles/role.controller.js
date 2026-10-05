import { CrudController } from '../../../shared/helpers/crud.js';

export class TenantRoleController extends CrudController {
  constructor({ tenantRoleService }) {
    super(tenantRoleService);
  }
}
