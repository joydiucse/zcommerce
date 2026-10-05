import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listUsersSchema, createUserSchema, updateUserSchema, idParams } from './user.validation.js';

export default function systemUserRoutes({ systemUserController: c }) {
  const r = Router();
  r.get('/', can('users.view'), validate(listUsersSchema), c.list);
  r.post('/', can('users.create'), validate(createUserSchema), c.create);
  r.get('/:id', can('users.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('users.update'), validate(updateUserSchema), c.update);
  r.delete('/:id', can('users.delete'), validate({ params: idParams }), c.destroy);
  return r;
}
