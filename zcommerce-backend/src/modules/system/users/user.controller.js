import { CrudController } from '../../../shared/helpers/crud.js';

export class SystemUserController extends CrudController {
  constructor({ systemUserService }) {
    super(systemUserService);
  }
}
