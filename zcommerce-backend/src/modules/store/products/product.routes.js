import { Router } from 'express';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listStoreProductsSchema, slugParams } from './product.validation.js';
import storeReviewRoutes from '../reviews/review.routes.js';

export default function storeProductRoutes(container) {
  const c = container.storeProductController;
  const r = Router();
  r.get('/', validate(listStoreProductsSchema), c.list);
  r.use('/:slug/reviews', storeReviewRoutes(container));
  r.get('/:slug', validate({ params: slugParams }), c.show);
  return r;
}
