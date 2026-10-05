import { z } from '../../../shared/validators/index.js';

export const loginSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshSchema = { body: z.object({ refresh_token: z.string().min(1) }) };
export const logoutSchema = { body: z.object({ refresh_token: z.string().optional() }) };
