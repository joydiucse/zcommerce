import { ok, created } from '../../../shared/helpers/response.js';

export class CheckoutController {
  constructor({ checkoutService: s }) {
    this.shippingMethods = async (req, res) => ok(res, await s.shippingMethods(req.query.cart_token || req.get('x-cart-token')));
    this.place = async (req, res) => created(res, await s.place(req.body, req.customer || null));
  }
}
