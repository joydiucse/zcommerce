import { z, listQuery, idParams, uuid, money } from '../../../shared/validators/index.js';

export const listInvoicesSchema = {
  query: listQuery.extend({
    status: z.enum(['draft', 'open', 'paid', 'void']).optional(),
    tenant_id: uuid.optional(),
    from: z.string().max(40).optional(),
    to: z.string().max(40).optional(),
  }),
};

export const createInvoiceSchema = {
  body: z
    .object({
      tenant_id: uuid,
      subscription_id: uuid.nullable().optional(),
      amount: money.optional(),
      currency: z.string().length(3).toUpperCase().default('USD'),
      status: z.enum(['draft', 'open']).default('open'),
      due_date: z.coerce.date().optional(),
      items: z
        .array(
          z.object({
            description: z.string().min(1).max(255),
            quantity: z.coerce.number().int().min(1).default(1),
            unit_price: money,
          }),
        )
        .default([]),
    })
    .refine((b) => b.amount !== undefined || b.items.length > 0, { message: 'Provide items or an amount', path: ['items'] }),
};

export { idParams };
