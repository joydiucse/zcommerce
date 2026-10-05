import type { StoreSettings } from "./types";

/** Mirrors the defaults in CONTRACT.md §4. Used whenever the API is unreachable. */
export const DEFAULT_SETTINGS: StoreSettings = {
  general: {
    store_name: "Demo Store",
    tagline: "",
    logo_url: null,
    favicon_url: null,
    contact_email: "",
    contact_phone: "",
    address: "",
    currency: "USD",
    currency_symbol: "$",
    locale: "en-US",
    timezone: "UTC",
  },
  theme: {
    primary_color: "#4f46e5",
    secondary_color: "#0f172a",
    accent_color: "#f59e0b",
    font_family: "Inter",
    border_radius: "md",
    footer_text: "© 2026 Demo Store. All rights reserved.",
  },
  seo: {
    meta_title: "Demo Store",
    title_template: "%s | Demo Store",
    meta_description: "",
    meta_keywords: "",
    og_image_url: null,
    twitter_handle: "",
    canonical_url: "",
    robots_index: true,
    google_site_verification: "",
    bing_site_verification: "",
    google_analytics_id: "",
    gtm_id: "",
    facebook_pixel_id: "",
    organization_schema: true,
  },
  social: { facebook: "", instagram: "", twitter: "", youtube: "", tiktok: "", linkedin: "" },
  homepage: {
    announcement_bar: { enabled: true, text: "Free shipping over $50", link: "" },
    hero_slides: [],
    featured_category_ids: [],
    sections: {
      featured_products: true,
      new_arrivals: true,
      categories: true,
      brands: true,
      newsletter: true,
    },
    products_per_section: 8,
  },
  navigation: {
    header_menu: [{ label: "Shop", url: "/products" }],
    footer_menus: [{ title: "Help", links: [{ label: "Contact", url: "/pages/contact" }] }],
  },
  checkout: {
    guest_checkout: true,
    tax_rate: 0,
    tax_inclusive: false,
    min_order_amount: 0,
    cod_enabled: true,
    manual_payment_enabled: true,
    manual_payment_instructions: "",
    terms_page_slug: "terms",
  },
  tenant: { name: "Store", slug: "" },
  store_url: null,
};

type Plain = Record<string, unknown>;

function isPlain(v: unknown): v is Plain {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep merge `value` onto `base`; arrays and primitives from `value` replace; null/undefined keep base. */
export function mergeDefaults<T>(base: T, value: unknown): T {
  if (!isPlain(base) || !isPlain(value)) {
    return (value === undefined || value === null ? base : value) as T;
  }
  const out: Plain = { ...base };
  for (const key of Object.keys(value)) {
    const b = (base as Plain)[key];
    const v = value[key];
    if (v === undefined) continue;
    if (v === null) {
      // keep explicit nulls only where the default is also nullable/null
      out[key] = b === null || b === undefined ? null : b;
      continue;
    }
    out[key] = isPlain(b) ? mergeDefaults(b, v) : v;
  }
  return out as T;
}
