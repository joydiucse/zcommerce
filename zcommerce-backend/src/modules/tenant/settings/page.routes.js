import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listPagesSchema, createPageSchema, updatePageSchema, idParams } from './page.validation.js';

export default function pageRoutes({ pageController: c }) {
  const r = Router();
  r.get('/', can('pages.view'), validate(listPagesSchema), c.list);
  r.post('/', can('pages.create'), validate(createPageSchema), c.create);
  r.get('/:id', can('pages.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('pages.update'), validate(updatePageSchema), c.update);
  r.delete('/:id', can('pages.delete'), validate({ params: idParams }), c.destroy);
  return r;
}
