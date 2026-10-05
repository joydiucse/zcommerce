import { ok } from '../../../shared/helpers/response.js';

export class StorefrontController {
  constructor({ storefrontService: s }) {
    this.settings = async (req, res) => ok(res, await s.settingsFor(req.tenant));
    this.sitemap = async (_req, res) => ok(res, await s.sitemap());
    this.resolve = async (req, res) => ok(res, await s.resolve(req.tenant));
    this.platform = async (_req, res) => ok(res, await s.platform());
  }
}
