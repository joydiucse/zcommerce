import { ok } from '../../../shared/helpers/response.js';

export class TenantAuthController {
  constructor({ tenantAuthService: s }) {
    this.login = async (req, res) => ok(res, await s.login(req.body));
    this.refresh = async (req, res) => ok(res, await s.refresh(req.body));
    this.logout = async (req, res) => ok(res, await s.logout(req.body));
    this.me = async (req, res) => ok(res, await s.me(req.tenant, req.user));
    this.updateProfile = async (req, res) => ok(res, await s.updateProfile(req.tenant, req.user, req.body));
    this.changePassword = async (req, res) => ok(res, await s.changePassword(req.tenant, req.user, req.body));
  }
}
