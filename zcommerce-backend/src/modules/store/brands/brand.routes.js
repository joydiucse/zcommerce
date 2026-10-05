import { Router } from 'express';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { slugParams } from './brand.validation.js';

export default function storeBrandRoutes({ storeBrandController: c }) {
  const r = Router();
  r.get('/', c.list);
  r.get('/:slug', validate({ params: slugParams }), c.show);
  return r;
}
