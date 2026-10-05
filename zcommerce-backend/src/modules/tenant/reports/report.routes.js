import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { salesReportSchema, topReportSchema } from './report.validation.js';

export default function reportRoutes({ reportController: c }) {
  const r = Router();
  r.get('/sales', can('reports.view'), validate(salesReportSchema), c.sales);
  r.get('/products', can('reports.view'), validate(topReportSchema), c.products);
  r.get('/customers', can('reports.view'), validate(topReportSchema), c.customers);
  return r;
}
