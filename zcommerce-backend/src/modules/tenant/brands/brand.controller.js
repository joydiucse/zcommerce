import { CrudController } from '../../../shared/helpers/crud.js';
import { ok } from '../../../shared/helpers/response.js';

export class BrandController extends CrudController {
  constructor({ brandService }) {
    super(brandService);
    const paginated = this.list;
    // ?all=true -> unpaginated flat list (for selects)
    this.list = async (req, res) => (req.query.all === true || req.query.all === 'true' ? ok(res, await brandService.all()) : paginated(req, res));
  }
}
