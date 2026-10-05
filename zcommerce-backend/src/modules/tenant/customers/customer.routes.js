import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listCustomersSchema, createCustomerSchema, updateCustomerSchema, idParams } from './customer.validation.js';

export default function customerRoutes({ customerController: c }) {
  const r = Router();
  r.get('/', can('customers.view'), validate(listCustomersSchema), c.list);
  r.post('/', can('customers.create'), validate(createCustomerSchema), c.create);
  r.get('/:id', can('customers.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('customers.update'), validate(updateCustomerSchema), c.update);
  r.delete('/:id', can('customers.delete'), validate({ params: idParams }), c.destroy);
  return r;
}
