import { ok } from '../../../shared/helpers/response.js';
import { ValidationError } from '../../../shared/exceptions/index.js';
import { zodDetails } from '../../../app/middleware/validation.middleware.js';
import { settingsSchemas } from './setting.validation.js';

export class SettingController {
  constructor({ settingService: s }) {
    this.index = async (req, res) => ok(res, await s.getAll(req.tenant.id));
    this.show = async (req, res) => ok(res, await s.getGroup(req.tenant.id, req.params.group));
    this.update = async (req, res) => {
      const result = settingsSchemas[req.params.group].safeParse(req.body ?? {});
      if (!result.success) throw new ValidationError('Validation failed', zodDetails(result.error));
      return ok(res, await s.update(req.tenant.id, req.params.group, result.data));
    };
  }
}
