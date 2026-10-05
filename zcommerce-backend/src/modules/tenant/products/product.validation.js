import { z, listQuery, idParams, uuid, slug, money, nullableMoney, boolish, imageList, attributeList } from '../../../shared/validators/index.js';

const body = z.object({
  name: z.string().trim().min(1).max(255),
  slug: slug.optional(),
  sku: z.string().trim().max(100).nullable().optional(),
  category_id: uuid.nullable().optional(),
  brand_id: uuid.nullable().optional(),
  short_description: z.string().max(1000).nullable().optional(),
  description: z.string().max(100000).nullable().optional(),
  price: money,
  compare_at_price: nullableMoney,
  cost_price: nullableMoney,
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  is_featured: z.boolean().default(false),
  track_inventory: z.boolean().default(true),
  stock_quantity: z.coerce.number().int().min(0).default(0),
  low_stock_threshold: z.coerce.number().int().min(0).default(5),
  weight: z.union([z.coerce.number().min(0), z.null()]).optional(),
  images: imageList.default([]),
  attributes: attributeList.default([]),
  tags: z.array(z.string().trim().max(50)).max(30).default([]),
  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(1000).nullable().optional(),
  published_at: z.coerce.date().nullable().optional(),
});

export const listProductsSchema = {
  query: listQuery.extend({
    status: z.enum(['draft', 'active', 'archived']).optional(),
    category_id: uuid.optional(),
    brand_id: uuid.optional(),
    is_featured: boolish.optional(),
    stock: z.enum(['in', 'low', 'out']).optional(),
  }),
};

export const createProductSchema = { body };
export const updateProductSchema = { params: idParams, body: body.partial() };
export const bulkProductsSchema = {
  body: z.object({ ids: z.array(uuid).min(1).max(500), action: z.enum(['delete', 'activate', 'archive']) }),
};
export { idParams };
