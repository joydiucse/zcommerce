import { ok, created } from '../../../shared/helpers/response.js';

export class StoreReviewController {
  constructor({ storeReviewService: s }) {
    this.list = async (req, res) => {
      const { data, meta } = await s.list(req.params.slug, req.query);
      return ok(res, data, meta);
    };
    this.create = async (req, res) => created(res, await s.create(req.params.slug, req.body, req.customer));
  }
}
