import { ok, created } from '../../../shared/helpers/response.js';

export class BillingController {
  constructor({ billingService: s }) {
    this.list = async (req, res) => {
      const { data, meta } = await s.list(req.query);
      return ok(res, data, meta);
    };
    this.show = async (req, res) => ok(res, await s.get(req.params.id));
    this.create = async (req, res) => created(res, await s.create(req.body, req));
    this.markPaid = async (req, res) => ok(res, await s.markPaid(req.params.id, req));
    this.void = async (req, res) => ok(res, await s.void(req.params.id, req));
  }
}
