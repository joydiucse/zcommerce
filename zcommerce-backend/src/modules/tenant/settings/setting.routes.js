import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { groupParams } from './setting.validation.js';

export default function settingRoutes({ settingController: c }) {
  const r = Router();
  r.get('/', can('settings.view'), c.index);
  r.get('/:group', can('settings.view'), validate({ params: groupParams }), c.show);
  r.put('/:group', can('settings.update'), validate({ params: groupParams }), c.update);
  return r;
}
