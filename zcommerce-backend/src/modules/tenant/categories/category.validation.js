import { z, listQuery, idParams, uuid, slug, boolish } from '../../../shared/validators/index.js';

const body = z.object({
  name: z.string().trim().min(1).max(150),
  slug: slug.optional(),
  parent_id: uuid.nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  image_url: z.string().max(2048).nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(1000).nullable().optional(),
});

export const listCategoriesSchema = {
  query: listQuery.extend({ parent_id: z.union([uuid, z.literal('null'), z.literal('root')]).optional(), all: boolish.optional(), is_active: boolish.optional() }),
};
export const createCategorySchema = { body };
export const updateCategorySchema = { params: idParams, body: body.partial() };
export { idParams };
