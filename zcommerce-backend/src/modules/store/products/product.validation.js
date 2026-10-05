import { z, slugParams, boolish } from '../../../shared/validators/index.js';

export const listStoreProductsSchema = {
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      search: z.string().max(200).optional(),
      category: z.string().max(180).optional(),
      brand: z.string().max(180).optional(),
      min_price: z.coerce.number().min(0).optional(),
      max_price: z.coerce.number().min(0).optional(),
      featured: boolish.optional(),
      in_stock: boolish.optional(),
      sort: z.enum(['newest', 'price_asc', 'price_desc', 'name', 'popular']).optional(),
    })
    .passthrough(),
};

export { slugParams };
