import { ok } from '../../../shared/helpers/response.js';

export class StoreOrderController {
  constructor({ storeOrderService: s }) {
    this.list = async (req, res) => {
      const { data, meta } = await s.list(req.customer, req.query);
      return ok(res, data, meta);
    };
    this.show = async (req, res) => ok(res, await s.get(req.params.order_number, { customer: req.customer, email: req.query.email }));
  }
}
