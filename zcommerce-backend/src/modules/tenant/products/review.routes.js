import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listReviewsSchema, updateReviewSchema, idParams } from './review.validation.js';

export default function reviewRoutes({ reviewController: c }) {
  const r = Router();
  r.get('/', can('reviews.view'), validate(listReviewsSchema), c.list);
  r.get('/:id', can('reviews.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('reviews.update'), validate(updateReviewSchema), c.update);
  r.delete('/:id', can('reviews.delete'), validate({ params: idParams }), c.destroy);
  return r;
}
