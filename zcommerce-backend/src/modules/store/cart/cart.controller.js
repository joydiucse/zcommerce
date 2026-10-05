import { ok, created } from '../../../shared/helpers/response.js';

const tokenOf = (req) => req.get('x-cart-token') || req.query.cart_token || req.body?.cart_token || null;

/** Every cart response echoes the (possibly new) token in the X-Cart-Token header. */
const send = (res, cart, status = 200) => {
  res.setHeader('X-Cart-Token', cart.token);
  return status === 201 ? created(res, cart) : ok(res, cart);
};

export class CartController {
  constructor({ cartService: s }) {
    this.create = async (_req, res) => send(res, await s.present(await s.create()), 201);
    this.show = async (req, res) => send(res, await s.get(tokenOf(req)));
    this.addItem = async (req, res) => send(res, await s.addItem(tokenOf(req), req.body));
    this.updateItem = async (req, res) => send(res, await s.updateItem(tokenOf(req), req.params.item_id, req.body));
    this.removeItem = async (req, res) => send(res, await s.removeItem(tokenOf(req), req.params.item_id));
    this.applyCoupon = async (req, res) => send(res, await s.applyCoupon(tokenOf(req), req.body));
    this.removeCoupon = async (req, res) => send(res, await s.removeCoupon(tokenOf(req)));
  }
}
