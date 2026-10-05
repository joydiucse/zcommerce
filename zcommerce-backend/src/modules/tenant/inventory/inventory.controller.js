import { ok } from '../../../shared/helpers/response.js';

export class InventoryController {
  constructor({ inventoryService: s }) {
    this.list = async (req, res) => {
      const { data, meta } = await s.listProducts(req.query);
      return ok(res, data, meta);
    };
    this.adjust = async (req, res) => ok(res, await s.adjust(req.body, req.user));
    this.movements = async (req, res) => {
      const { data, meta } = await s.listMovements(req.query);
      return ok(res, data, meta);
    };
  }
}
