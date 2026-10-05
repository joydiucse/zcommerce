import { Router } from 'express';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { loginLimiter, rateLimit } from '../../../app/middleware/rate-limit.middleware.js';
import { customerAuth } from '../../../app/middleware/store.middleware.js';
import { registerSchema, loginSchema, refreshSchema, logoutSchema, updateMeSchema } from './customer.validation.js';

const registerLimiter = rateLimit({ bucket: 'register', windowSec: 3600, max: 20 });

export default function storeCustomerRoutes({ storeCustomerController: c }) {
  const r = Router();
  r.post('/register', registerLimiter, validate(registerSchema), c.register);
  r.post('/login', loginLimiter, validate(loginSchema), c.login);
  r.post('/refresh', validate(refreshSchema), c.refresh);
  r.post('/logout', validate(logoutSchema), c.logout);
  r.get('/me', customerAuth(), c.me);
  r.put('/me', customerAuth(), validate(updateMeSchema), c.updateMe);
  return r;
}
