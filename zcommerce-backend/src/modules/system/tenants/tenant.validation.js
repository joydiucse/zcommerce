import { z, listQuery, idParams, uuid, slug, email, password } from '../../../shared/validators/index.js';

const RESERVED = ['www', 'api', 'admin', 'system', 'app', 'store', 'static', 'storage'];
const tenantSlug = slug.max(60).refine((s) => !RESERVED.includes(s), { message: 'This slug is reserved' });
// Public storefront URL; its host[:port] is what the store API matches the request host against
// ("https://shop.example.com", "https://demo.zcommerce.app", "http://localhost:3002").
const siteUrl = z
  .string()
  .trim()
  .max(500)
  .url('Must be a full URL, e.g. https://shop.example.com')
  .refine((u) => /^https?:\/\//i.test(u), 'Must start with http:// or https://')
  .nullable()
  .optional()
  .or(z.literal(''));

export const listTenantsSchema = {
  query: listQuery.extend({ status: z.enum(['trial', 'active', 'suspended']).optional(), plan_id: uuid.optional() }),
};

export const createTenantSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(150),
    slug: tenantSlug,
    email,
    phone: z.string().max(50).nullable().optional(),
    plan_id: uuid.nullable().optional(),
    site_url: siteUrl,
    owner: z.object({ name: z.string().trim().min(1).max(150), email, password }),
  }),
};

export const updateTenantSchema = {
  params: idParams,
  body: z
    .object({
      name: z.string().trim().min(1).max(150),
      slug: tenantSlug,
      email,
      phone: z.string().max(50).nullable(),
      plan_id: uuid.nullable(),
      site_url: siteUrl,
      status: z.enum(['trial', 'active', 'suspended']),
      trial_ends_at: z.coerce.date().nullable(),
    })
    .partial(),
};

export { idParams };
