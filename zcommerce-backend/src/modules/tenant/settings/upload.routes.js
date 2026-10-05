import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { uploader } from './upload.service.js';

/** Any staff member who can edit catalog/content/settings may upload images. */
export default function uploadRoutes({ uploadController: c }) {
  const r = Router();
  r.post(
    '/',
    can('products.create', 'products.update', 'categories.create', 'categories.update', 'brands.create', 'brands.update', 'pages.create', 'pages.update', 'settings.update'),
    uploader.single('file'),
    c.store,
  );
  return r;
}
