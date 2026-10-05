import { created } from '../../../shared/helpers/response.js';

export class UploadController {
  constructor({ uploadService }) {
    this.store = async (req, res) => created(res, uploadService.describe(req.tenant.id, req.file));
  }
}
