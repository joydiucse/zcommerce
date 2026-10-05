import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listPlansSchema, createPlanSchema, updatePlanSchema, idParams } from './plan.validation.js';

export default function planRoutes({ planController: c }) {
  const r = Router();
  r.get('/', can('plans.view', 'tenants.view'), validate(listPlansSchema), c.list);
  r.post('/', can('plans.create'), validate(createPlanSchema), c.create);
  r.get('/:id', can('plans.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('plans.update'), validate(updatePlanSchema), c.update);
  r.delete('/:id', can('plans.delete'), validate({ params: idParams }), c.destroy);
  return r;
}
