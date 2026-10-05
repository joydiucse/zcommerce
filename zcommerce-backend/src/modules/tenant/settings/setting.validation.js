import { z } from '../../../shared/validators/index.js';
import { SETTINGS_GROUPS } from '../../../shared/constants/index.js';

const str = (max = 500) => z.string().max(max);
const nullableUrl = z.string().max(2048).nullable();
const color = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Must be a hex color');
const link = z.object({ label: str(100), url: str(2048) });

/** One zod schema per settings group. Fields are optional: omitted keys keep their current value. */
export const settingsSchemas = {
  general: z
    .object({
      store_name: str(150).min(1),
      tagline: str(255),
      logo_url: nullableUrl,
      favicon_url: nullableUrl,
      contact_email: z.union([z.string().email(), z.literal('')]),
      contact_phone: str(50),
      address: str(500),
      currency: z.string().length(3).toUpperCase(),
      currency_symbol: str(5),
      locale: str(20),
      timezone: str(64),
    })
    .partial(),
  theme: z
    .object({
      primary_color: color,
      secondary_color: color,
      accent_color: color,
      font_family: str(100),
      border_radius: z.enum(['none', 'sm', 'md', 'lg', 'full']),
      footer_text: str(500),
    })
    .partial(),
  seo: z
    .object({
      meta_title: str(255),
      title_template: str(255),
      meta_description: str(1000),
      meta_keywords: str(1000),
      og_image_url: nullableUrl,
      twitter_handle: str(100),
      canonical_url: str(2048),
      robots_index: z.boolean(),
      google_site_verification: str(255),
      bing_site_verification: str(255),
      google_analytics_id: str(100),
      gtm_id: str(100),
      facebook_pixel_id: str(100),
      organization_schema: z.boolean(),
    })
    .partial(),
  social: z
    .object({ facebook: str(2048), instagram: str(2048), twitter: str(2048), youtube: str(2048), tiktok: str(2048), linkedin: str(2048) })
    .partial(),
  homepage: z
    .object({
      announcement_bar: z.object({ enabled: z.boolean(), text: str(255), link: str(2048) }).partial(),
      hero_slides: z
        .array(
          z.object({
            image_url: str(2048),
            title: str(255).optional().default(''),
            subtitle: str(500).optional().default(''),
            cta_text: str(100).optional().default(''),
            cta_link: str(2048).optional().default(''),
          }),
        )
        .max(10),
      featured_category_ids: z.array(z.string().uuid()).max(20),
      sections: z
        .object({ featured_products: z.boolean(), new_arrivals: z.boolean(), categories: z.boolean(), brands: z.boolean(), newsletter: z.boolean() })
        .partial(),
      products_per_section: z.coerce.number().int().min(1).max(48),
    })
    .partial(),
  navigation: z
    .object({
      header_menu: z.array(link).max(30),
      footer_menus: z.array(z.object({ title: str(100), links: z.array(link).max(30) })).max(10),
    })
    .partial(),
  checkout: z
    .object({
      guest_checkout: z.boolean(),
      tax_rate: z.coerce.number().min(0).max(100),
      tax_inclusive: z.boolean(),
      min_order_amount: z.coerce.number().min(0),
      cod_enabled: z.boolean(),
      manual_payment_enabled: z.boolean(),
      manual_payment_instructions: str(2000),
      terms_page_slug: str(180),
    })
    .partial(),
  notifications: z
    .object({
      admin_order_email: z.union([z.string().email(), z.literal('')]),
      low_stock_alerts: z.boolean(),
      customer_order_emails: z.boolean(),
    })
    .partial(),
};

export const groupParams = z.object({ group: z.enum(SETTINGS_GROUPS) });
