import { ok } from '../../../shared/helpers/response.js';

export class StoreProductController {
  constructor({ storeProductService: s }) {
    this.list = async (req, res) => {
      const { data, meta } = await s.list(req.query);
      return ok(res, data, meta);
    };
    this.show = async (req, res) => ok(res, await s.get(req.params.slug));
  }
}
