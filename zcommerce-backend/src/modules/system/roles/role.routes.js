import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listRolesSchema, createRoleSchema, updateRoleSchema, idParams } from './role.validation.js';

export default function systemRoleRoutes({ systemRoleController: c }) {
  const r = Router();
  r.get('/', can('roles.view'), validate(listRolesSchema), c.list);
  r.post('/', can('roles.create'), validate(createRoleSchema), c.create);
  r.get('/:id', can('roles.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('roles.update'), validate(updateRoleSchema), c.update);
  r.delete('/:id', can('roles.delete'), validate({ params: idParams }), c.destroy);
  return r;
}
