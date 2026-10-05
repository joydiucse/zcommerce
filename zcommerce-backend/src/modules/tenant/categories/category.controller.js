import { CrudController } from '../../../shared/helpers/crud.js';
import { ok } from '../../../shared/helpers/response.js';

export class CategoryController extends CrudController {
  constructor({ categoryService }) {
    super(categoryService);
    const paginated = this.list;
    // ?all=true -> unpaginated flat list (for selects)
    this.list = async (req, res) => (req.query.all === true || req.query.all === 'true' ? ok(res, await categoryService.all()) : paginated(req, res));
  }
}
