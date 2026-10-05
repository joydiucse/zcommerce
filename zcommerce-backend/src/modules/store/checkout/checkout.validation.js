import { z, uuid, email, address } from '../../../shared/validators/index.js';

export const shippingMethodsSchema = { query: z.object({ cart_token: z.string().max(64).optional() }).passthrough() };

export const checkoutSchema = {
  body: z.object({
    cart_token: z.string().min(1, 'cart_token is required').max(64),
    email,
    phone: z.string().trim().max(50).optional().nullable(),
    shipping_address: address,
    billing_address: address.optional().nullable(),
    shipping_method_id: uuid,
    payment_method: z.enum(['cod', 'manual']),
    notes: z.string().max(2000).optional().nullable(),
  }),
};
