import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listBrandsSchema, createBrandSchema, updateBrandSchema, idParams } from './brand.validation.js';

export default function brandRoutes({ brandController: c }) {
  const r = Router();
  r.get('/', can('brands.view', 'products.view'), validate(listBrandsSchema), c.list);
  r.post('/', can('brands.create'), validate(createBrandSchema), c.create);
  r.get('/:id', can('brands.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('brands.update'), validate(updateBrandSchema), c.update);
  r.delete('/:id', can('brands.delete'), validate({ params: idParams }), c.destroy);
  return r;
}
