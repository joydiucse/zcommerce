import { ok, created } from '../../../shared/helpers/response.js';

export class SubscriptionController {
  constructor({ subscriptionService: s }) {
    this.list = async (req, res) => {
      const { data, meta } = await s.list(req.query);
      return ok(res, data, meta);
    };
    this.show = async (req, res) => ok(res, await s.get(req.params.id));
    this.create = async (req, res) => created(res, await s.create(req.body, req));
    this.update = async (req, res) => ok(res, await s.update(req.params.id, req.body, req));
    this.cancel = async (req, res) => ok(res, await s.cancel(req.params.id, req));
  }
}
