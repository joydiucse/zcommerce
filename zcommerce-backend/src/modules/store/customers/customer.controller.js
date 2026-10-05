import { ok, created } from '../../../shared/helpers/response.js';

export class StoreCustomerController {
  constructor({ storeCustomerService: s }) {
    this.register = async (req, res) => created(res, await s.register(req.body));
    this.login = async (req, res) => ok(res, await s.login(req.body));
    this.refresh = async (req, res) => ok(res, await s.refresh(req.body));
    this.logout = async (req, res) => ok(res, await s.logout(req.body));
    this.me = async (req, res) => ok(res, await s.me(req.customer.id));
    this.updateMe = async (req, res) => ok(res, await s.updateMe(req.customer.id, req.body));
  }
}
