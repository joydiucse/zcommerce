import { CrudController } from '../../../shared/helpers/crud.js';

export class SystemRoleController extends CrudController {
  constructor({ systemRoleService }) {
    super(systemRoleService);
  }
}
