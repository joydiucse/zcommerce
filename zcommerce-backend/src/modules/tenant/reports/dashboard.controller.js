import { ok } from '../../../shared/helpers/response.js';

export class DashboardController {
  constructor({ dashboardService }) {
    this.overview = async (_req, res) => ok(res, await dashboardService.overview());
  }
}
