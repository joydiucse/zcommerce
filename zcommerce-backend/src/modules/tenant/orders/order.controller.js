import { ok } from '../../../shared/helpers/response.js';

export class OrderController {
  constructor({ orderService: s }) {
    this.list = async (req, res) => {
      const { data, meta } = await s.list(req.query);
      return ok(res, data, meta);
    };
    this.show = async (req, res) => ok(res, await s.get(req.params.id));
    this.updateStatus = async (req, res) => ok(res, await s.updateStatus(req.params.id, req.body, req.user));
    this.updatePaymentStatus = async (req, res) => ok(res, await s.updatePaymentStatus(req.params.id, req.body, req.user));
  }
}
