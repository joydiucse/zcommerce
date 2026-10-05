import { CrudController } from '../../../shared/helpers/crud.js';
import { ok } from '../../../shared/helpers/response.js';

export class ProductController extends CrudController {
  constructor({ productService }) {
    super(productService);
    this.bulk = async (req, res) => ok(res, await productService.bulk(req.body));
  }
}
