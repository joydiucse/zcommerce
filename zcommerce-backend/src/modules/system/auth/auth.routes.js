import { Router } from 'express';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { loginLimiter } from '../../../app/middleware/rate-limit.middleware.js';
import { requireSystemAuth } from '../../../app/middleware/system.middleware.js';
import { loginSchema, refreshSchema, logoutSchema } from './auth.validation.js';

export default function systemAuthRoutes({ systemAuthController: c }) {
  const r = Router();
  r.post('/login', loginLimiter, validate(loginSchema), c.login);
  r.post('/refresh', validate(refreshSchema), c.refresh);
  r.post('/logout', validate(logoutSchema), c.logout);
  r.get('/me', requireSystemAuth(), c.me);
  return r;
}
