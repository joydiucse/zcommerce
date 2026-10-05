import { z, listQuery, idParams, slug, boolish } from '../../../shared/validators/index.js';

const body = z.object({
  title: z.string().trim().min(1).max(255),
  slug: slug.optional(),
  content: z.string().max(200000).nullable().optional(),
  is_published: z.boolean().default(false),
  show_in_footer: z.boolean().default(false),
  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(1000).nullable().optional(),
});

export const listPagesSchema = { query: listQuery.extend({ is_published: boolish.optional() }) };
export const createPageSchema = { body };
export const updatePageSchema = { params: idParams, body: body.partial() };
export { idParams };
