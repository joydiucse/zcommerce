import { ok } from '../../../shared/helpers/response.js';

export class SearchController {
  constructor({ searchService }) {
    this.search = async (req, res) => ok(res, await searchService.search(req.query));
  }
}
