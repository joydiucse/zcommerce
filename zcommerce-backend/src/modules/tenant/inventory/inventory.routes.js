import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listInventorySchema, adjustSchema, listMovementsSchema } from './inventory.validation.js';

export default function inventoryRoutes({ inventoryController: c }) {
  const r = Router();
  r.get('/', can('inventory.view'), validate(listInventorySchema), c.list);
  r.post('/adjust', can('inventory.update'), validate(adjustSchema), c.adjust);
  r.get('/movements', can('inventory.view'), validate(listMovementsSchema), c.movements);
  return r;
}
