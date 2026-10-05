import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listCategoriesSchema, createCategorySchema, updateCategorySchema, idParams } from './category.validation.js';

export default function categoryRoutes({ categoryController: c }) {
  const r = Router();
  r.get('/', can('categories.view', 'products.view'), validate(listCategoriesSchema), c.list);
  r.post('/', can('categories.create'), validate(createCategorySchema), c.create);
  r.get('/:id', can('categories.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('categories.update'), validate(updateCategorySchema), c.update);
  r.delete('/:id', can('categories.delete'), validate({ params: idParams }), c.destroy);
  return r;
}
