import { Router } from 'express';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { customerAuth } from '../../../app/middleware/store.middleware.js';
import { rateLimit } from '../../../app/middleware/rate-limit.middleware.js';
import { listReviewsSchema, createReviewSchema } from './review.validation.js';

const reviewLimiter = rateLimit({ bucket: 'review', windowSec: 3600, max: 20 });

/** Mounted at /store/products/:slug/reviews */
export default function storeReviewRoutes({ storeReviewController: c }) {
  const r = Router({ mergeParams: true });
  r.get('/', validate(listReviewsSchema), c.list);
  r.post('/', reviewLimiter, customerAuth({ optional: true }), validate(createReviewSchema), c.create);
  return r;
}
