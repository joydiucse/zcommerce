import type { TenantSettings } from "@/types";

/** Contract §4 defaults — used to fill any keys missing from the API response. */
export const SETTINGS_DEFAULTS: TenantSettings = {
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
    sections: { featured_products: true, new_arrivals: true, categories: true, brands: true, newsletter: true },
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
  notifications: { admin_order_email: "", low_stock_alerts: true, customer_order_emails: true },
};

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep-merge API values over defaults (arrays replace, nulls kept). */
export function mergeDefaults<T>(defaults: T, value: unknown): T {
  if (!isObj(defaults) || !isObj(value)) return (value === undefined ? defaults : (value as T));
  const out: Record<string, unknown> = { ...defaults };
  for (const [k, v] of Object.entries(value)) {
    const d = (defaults as Record<string, unknown>)[k];
    out[k] = isObj(d) && isObj(v) ? mergeDefaults(d, v) : v === undefined ? d : v;
  }
  return out as T;
}

export const CURRENCIES: { code: string; symbol: string; name: string }[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
];

export const LOCALES = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "en-IN", label: "English (India)" },
  { value: "bn-BD", label: "বাংলা (Bangladesh)" },
  { value: "de-DE", label: "Deutsch (Deutschland)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "it-IT", label: "Italiano (Italia)" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "nl-NL", label: "Nederlands" },
  { value: "ja-JP", label: "日本語" },
  { value: "zh-CN", label: "中文 (简体)" },
  { value: "ar-AE", label: "العربية" },
  { value: "hi-IN", label: "हिन्दी" },
];

export function timezones(): string[] {
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
    const list = intl.supportedValuesOf?.("timeZone");
    if (list?.length) return ["UTC", ...list.filter((t) => t !== "UTC")];
  } catch {
    /* ignore */
  }
  return ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Dhaka", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"];
}

export const FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Poppins",
  "Montserrat",
  "Nunito",
  "Raleway",
  "Work Sans",
  "DM Sans",
  "Manrope",
  "Playfair Display",
  "Merriweather",
  "Lora",
  "System UI",
];
