import { CrudController } from '../../../shared/helpers/crud.js';

export class PageController extends CrudController {
  constructor({ pageService }) {
    super(pageService);
  }
}
