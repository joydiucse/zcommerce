import { z, listQuery, idParams, slug, money, boolish } from '../../../shared/validators/index.js';

const body = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slug.optional(),
  description: z.string().max(2000).nullable().optional(),
  price_monthly: money.default(0),
  price_yearly: money.default(0),
  currency: z.string().length(3).toUpperCase().default('USD'),
  limits: z
    .object({
      products: z.coerce.number().int().min(0),
      staff: z.coerce.number().int().min(0),
      storage_mb: z.coerce.number().int().min(0),
    })
    .default({ products: 100, staff: 2, storage_mb: 500 }),
  features: z.array(z.string().max(200)).default([]),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export const listPlansSchema = { query: listQuery.extend({ is_active: boolish.optional() }) };
export const createPlanSchema = { body };
export const updatePlanSchema = {
  params: idParams,
  body: body.partial(),
};
export { idParams };
