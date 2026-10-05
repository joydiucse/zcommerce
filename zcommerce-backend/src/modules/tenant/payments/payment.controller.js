import { ok } from '../../../shared/helpers/response.js';

export class PaymentController {
  constructor({ paymentService }) {
    this.list = async (req, res) => {
      const { data, meta } = await paymentService.list(req.query);
      return ok(res, data, meta);
    };
  }
}
