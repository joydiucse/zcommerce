import { ok } from '../../../shared/helpers/response.js';

export class ReportController {
  constructor({ reportService: s }) {
    this.sales = async (req, res) => ok(res, await s.sales(req.query));
    this.products = async (req, res) => ok(res, await s.products(req.query));
    this.customers = async (req, res) => ok(res, await s.customers(req.query));
  }
}
