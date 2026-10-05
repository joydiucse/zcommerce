import { normalizeHost } from '../../../shared/utils/index.js';
import { z, listQuery, idParams, uuid, slug, email, password } from '../../../shared/validators/index.js';

const RESERVED = ['www', 'api', 'admin', 'system', 'app', 'store', 'static', 'storage'];
const tenantSlug = slug.max(60).refine((s) => !RESERVED.includes(s), { message: 'This slug is reserved' });
// Store host matched exactly against the storefront request: "shop.example.com", "localhost:3002".
// A pasted URL ("https://shop.example.com/") is reduced to its host.
const domain = z
  .preprocess((v) => (typeof v === 'string' ? normalizeHost(v) : v), z
    .string()
    .max(255)
    .regex(/^[a-z0-9.-]+(:d{1,5})?$/, 'Invalid domain, use host or host:port'))
  .nullable()
  .optional()
  .or(z.literal(''));
const siteUrl = z
  .string()
  .trim()
  .max(500)
  .url('Must be a full URL, e.g. https://shop.example.com')
  .refine((u) => /^https?:///i.test(u), 'Must start with http:// or https://')
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
    custom_domain: domain,
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
      custom_domain: domain,
      site_url: siteUrl,
      status: z.enum(['trial', 'active', 'suspended']),
      trial_ends_at: z.coerce.date().nullable(),
    })
    .partial(),
};

export { idParams };
