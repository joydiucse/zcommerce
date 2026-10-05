import { z, listQuery, uuid } from '../../../shared/validators/index.js';

const movementType = z.enum(['adjustment', 'sale', 'return', 'restock']);

export const listInventorySchema = {
  query: listQuery.extend({ stock: z.enum(['in', 'low', 'out']).optional(), status: z.enum(['draft', 'active', 'archived']).optional() }),
};

export const adjustSchema = {
  body: z.object({
    product_id: uuid,
    quantity: z.coerce
      .number()
      .int()
      .refine((n) => n !== 0, 'Quantity cannot be zero'),
    type: movementType.default('adjustment'),
    reason: z.string().max(255).optional().nullable(),
  }),
};

export const listMovementsSchema = { query: listQuery.extend({ product_id: uuid.optional(), type: movementType.optional() }) };
