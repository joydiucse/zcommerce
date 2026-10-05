import { ok } from '../../../shared/helpers/response.js';

export class StoreCategoryController {
  constructor({ storeCategoryService: s }) {
    this.tree = async (_req, res) => ok(res, await s.tree());
    this.show = async (req, res) => ok(res, await s.get(req.params.slug));
  }
}
