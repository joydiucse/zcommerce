import { Router } from 'express';
import { can } from '../../../app/middleware/permission.middleware.js';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { listSubscriptionsSchema, createSubscriptionSchema, updateSubscriptionSchema, idParams } from './subscription.validation.js';

export default function subscriptionRoutes({ subscriptionController: c }) {
  const r = Router();
  r.get('/', can('subscriptions.view'), validate(listSubscriptionsSchema), c.list);
  r.post('/', can('subscriptions.create'), validate(createSubscriptionSchema), c.create);
  r.get('/:id', can('subscriptions.view'), validate({ params: idParams }), c.show);
  r.put('/:id', can('subscriptions.update'), validate(updateSubscriptionSchema), c.update);
  r.post('/:id/cancel', can('subscriptions.update'), validate({ params: idParams }), c.cancel);
  return r;
}
