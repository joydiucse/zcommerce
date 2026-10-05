import { z, listQuery, idParams, slug, boolish } from '../../../shared/validators/index.js';

const body = z.object({
  name: z.string().trim().min(1).max(150),
  slug: slug.optional(),
  description: z.string().max(5000).nullable().optional(),
  logo_url: z.string().max(2048).nullable().optional(),
  is_active: z.boolean().default(true),
  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(1000).nullable().optional(),
});

export const listBrandsSchema = { query: listQuery.extend({ all: boolish.optional(), is_active: boolish.optional() }) };
export const createBrandSchema = { body };
export const updateBrandSchema = { params: idParams, body: body.partial() };
export { idParams };
