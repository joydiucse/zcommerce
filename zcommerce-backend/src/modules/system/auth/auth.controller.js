import { ok } from '../../../shared/helpers/response.js';

export class SystemAuthController {
  constructor({ systemAuthService: s }) {
    this.login = async (req, res) => ok(res, await s.login(req.body));
    this.refresh = async (req, res) => ok(res, await s.refresh(req.body));
    this.logout = async (req, res) => ok(res, await s.logout(req.body));
    this.me = async (req, res) => ok(res, await s.me(req.user, req.permissions));
  }
}
