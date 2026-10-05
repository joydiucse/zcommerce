import { ok } from '../../../shared/helpers/response.js';

export class ReviewController {
  constructor({ reviewService: s }) {
    this.list = async (req, res) => {
      const { data, meta } = await s.list(req.query);
      return ok(res, data, meta);
    };
    this.show = async (req, res) => ok(res, await s.get(req.params.id));
    this.update = async (req, res) => ok(res, await s.update(req.params.id, req.body));
    this.destroy = async (req, res) => ok(res, await s.remove(req.params.id));
  }
}
