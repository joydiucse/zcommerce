import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listInvoicesSchema, createInvoiceSchema, idParams } from './billing.validation.js';

export default function billingRoutes({ billingController: c }) {
  const r = Router();
  r.get('/invoices', can('billing.view'), validate(listInvoicesSchema), c.list);
  r.post('/invoices', can('billing.update'), validate(createInvoiceSchema), c.create);
  r.get('/invoices/:id', can('billing.view'), validate({ params: idParams }), c.show);
  r.post('/invoices/:id/mark-paid', can('billing.update'), validate({ params: idParams }), c.markPaid);
  r.post('/invoices/:id/void', can('billing.update'), validate({ params: idParams }), c.void);
  return r;
}
