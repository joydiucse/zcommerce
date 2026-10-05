import { ok } from '../../../shared/helpers/response.js';

export class StoreBrandController {
  constructor({ storeBrandService: s }) {
    this.list = async (_req, res) => ok(res, await s.list());
    this.show = async (req, res) => ok(res, await s.get(req.params.slug));
  }
}
