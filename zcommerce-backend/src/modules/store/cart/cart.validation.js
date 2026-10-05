import { z, uuid } from '../../../shared/validators/index.js';

export const addItemSchema = {
  body: z.object({ cart_token: z.string().max(64).optional(), product_id: uuid, quantity: z.coerce.number().int().min(1).max(999).default(1) }),
};

export const updateItemSchema = {
  params: z.object({ item_id: uuid }),
  body: z.object({ cart_token: z.string().max(64).optional(), quantity: z.coerce.number().int().min(0).max(999) }),
};

export const itemParams = { params: z.object({ item_id: uuid }) };

export const couponSchema = { body: z.object({ cart_token: z.string().max(64).optional(), code: z.string().trim().min(1, 'Coupon code is required').max(50) }) };
