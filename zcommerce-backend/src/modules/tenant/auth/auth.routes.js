import { Router } from 'express';
import { validate } from '../../../app/middleware/validation.middleware.js';
import { loginLimiter } from '../../../app/middleware/rate-limit.middleware.js';
import { requireTenantAuth } from '../../../app/middleware/tenant.middleware.js';
import { loginSchema, refreshSchema, logoutSchema, profileSchema, passwordSchema } from './auth.validation.js';

export default function tenantAuthRoutes({ tenantAuthController: c }) {
  const r = Router();
  r.post('/login', loginLimiter, validate(loginSchema), c.login);
  r.post('/refresh', validate(refreshSchema), c.refresh);
  r.post('/logout', validate(logoutSchema), c.logout);
  r.get('/me', requireTenantAuth(), c.me);
  r.put('/profile', requireTenantAuth(), validate(profileSchema), c.updateProfile);
  r.put('/password', requireTenantAuth(), validate(passwordSchema), c.changePassword);
  return r;
}
