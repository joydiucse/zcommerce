import { ok, created } from '../../../shared/helpers/response.js';

export class TenantController {
  constructor({ tenantService: s }) {
    this.list = async (req, res) => {
      const { data, meta } = await s.list(req.query);
      return ok(res, data, meta);
    };
    this.show = async (req, res) => ok(res, await s.get(req.params.id));
    this.create = async (req, res) => created(res, await s.create(req.body, req));
    this.update = async (req, res) => ok(res, await s.update(req.params.id, req.body, req));
    this.destroy = async (req, res) => ok(res, await s.remove(req.params.id, req));
    this.suspend = async (req, res) => ok(res, await s.suspend(req.params.id, req));
    this.activate = async (req, res) => ok(res, await s.activate(req.params.id, req));
    this.dashboard = async (_req, res) => ok(res, await s.dashboard());
  }
}
