import { z } from 'zod';

export { z };

export const uuid = z.string().uuid();
export const idParams = z.object({ id: uuid });
export const slugParams = z.object({ slug: z.string().min(1).max(200) });

export const slug = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers and dashes');

export const email = z.string().trim().toLowerCase().email().max(255);
export const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
export const nullableString = (max = 255) => z.string().max(max).nullable().optional();
export const money = z.coerce.number().min(0).max(99999999);
export const nullableMoney = z.union([z.coerce.number().min(0).max(99999999), z.null()]).optional();
export const boolish = z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean());
export const dateish = z.union([z.coerce.date(), z.null()]).optional();
export const url = z.string().max(2048);

/** Generic list query (page/limit/search/sort/order). Extra filters pass through. */
export const listQuery = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().max(200).optional(),
    sort: z.string().max(50).optional(),
    order: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  })
  .passthrough();

export const address = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().trim().max(50).optional().default(''),
  line1: z.string().trim().min(1).max(255),
  line2: z.string().trim().max(255).optional().nullable().default(''),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().max(120).optional().nullable().default(''),
  postal_code: z.string().trim().max(30).optional().nullable().default(''),
  country: z.string().trim().min(1).max(120),
});

export const imageList = z.array(z.object({ url: url, alt: z.string().max(255).optional().default('') })).max(20);
export const attributeList = z.array(z.object({ name: z.string().max(100), value: z.string().max(500) })).max(50);
