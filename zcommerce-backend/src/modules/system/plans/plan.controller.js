import { CrudController } from '../../../shared/helpers/crud.js';

export class PlanController extends CrudController {
  constructor({ planService }) {
    super(planService);
  }
}
