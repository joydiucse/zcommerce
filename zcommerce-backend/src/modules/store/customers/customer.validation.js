import { z, email, password, address } from '../../../shared/validators/index.js';

export const registerSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(150),
    email,
    password,
    phone: z.string().trim().max(50).optional().nullable(),
    accepts_marketing: z.boolean().optional(),
  }),
};

export const loginSchema = {
  body: z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1, 'Password is required') }),
};

export const refreshSchema = { body: z.object({ refresh_token: z.string().min(1) }) };
export const logoutSchema = { body: z.object({ refresh_token: z.string().optional() }) };

export const updateMeSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(150).optional(),
    phone: z.string().trim().max(50).nullable().optional(),
    addresses: z.array(address).max(20).optional(),
    accepts_marketing: z.boolean().optional(),
    password: password.optional(),
  }),
};
