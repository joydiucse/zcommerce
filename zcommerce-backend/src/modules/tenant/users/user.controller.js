import { CrudController } from '../../../shared/helpers/crud.js';

export class TenantUserController extends CrudController {
  constructor({ tenantUserService }) {
    super(tenantUserService);
  }
}
