import { Router } from 'express';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { slugParams } from './category.validation.js';

export default function storeCategoryRoutes({ storeCategoryController: c }) {
  const r = Router();
  r.get('/', c.tree);
  r.get('/:slug', validate({ params: slugParams }), c.show);
  return r;
}
