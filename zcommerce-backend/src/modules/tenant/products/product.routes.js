import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listProductsSchema, createProductSchema, updateProductSchema, bulkProductsSchema, idParams } from './product.validation.js';

export default function productRoutes({ productController: c }) {
  const r = Router();
  r.get('/', can('products.view'), validate(listProductsSchema), c.list);
  r.post('/', can('products.create'), validate(createProductSchema), c.create);
  // delete requires products.delete; activate/archive require products.update
  r.post(
    '/bulk',
    validate(bulkProductsSchema),
    (req, res, next) => can(req.body.action === 'delete' ? 'products.delete' : 'products.update')(req, res, next),
    c.bulk,
  );
  r.get('/:id', can('products.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('products.update'), validate(updateProductSchema), c.update);
  r.delete('/:id', can('products.delete'), validate({ params: idParams }), c.destroy);
  return r;
}
