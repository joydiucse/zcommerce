import { z, password } from '../../../shared/validators/index.js';

export const loginSchema = {
  body: z.object({
    tenant: z.string().trim().toLowerCase().min(1, 'Store is required').max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshSchema = { body: z.object({ refresh_token: z.string().min(1) }) };
export const logoutSchema = { body: z.object({ refresh_token: z.string().optional() }) };

export const profileSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(150).optional(),
    avatar_url: z.string().max(2048).nullable().optional(),
  }),
};

export const passwordSchema = {
  body: z.object({ current_password: z.string().min(1, 'Current password is required'), password }),
};
