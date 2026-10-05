import { Router } from 'express';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { searchSchema } from './search.validation.js';

export default function searchRoutes({ searchController: c }) {
  const r = Router();
  r.get('/', validate(searchSchema), c.search);
  return r;
}
