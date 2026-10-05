/** Default tenant settings (CONTRACT.md section 4). Stored values are deep-merged on top. */
export const SETTINGS_DEFAULTS = Object.freeze({
  general: {
    store_name: 'Demo Store',
    tagline: '',
    logo_url: null,
    favicon_url: null,
    contact_email: '',
    contact_phone: '',
    address: '',
    currency: 'USD',
    currency_symbol: '$',
    locale: 'en-US',
    timezone: 'UTC',
  },
  theme: {
    primary_color: '#4f46e5',
    secondary_color: '#0f172a',
    accent_color: '#f59e0b',
    font_family: 'Inter',
    border_radius: 'md',
    footer_text: '© 2026 Demo Store. All rights reserved.',
  },
  seo: {
    meta_title: 'Demo Store',
    title_template: '%s | Demo Store',
    meta_description: '',
    meta_keywords: '',
    og_image_url: null,
    twitter_handle: '',
    canonical_url: '',
    robots_index: true,
    google_site_verification: '',
    bing_site_verification: '',
    google_analytics_id: '',
    gtm_id: '',
    facebook_pixel_id: '',
    organization_schema: true,
  },
  social: { facebook: '', instagram: '', twitter: '', youtube: '', tiktok: '', linkedin: '' },
  homepage: {
    announcement_bar: { enabled: true, text: 'Free shipping over $50', link: '' },
    hero_slides: [],
    featured_category_ids: [],
    sections: { featured_products: true, new_arrivals: true, categories: true, brands: true, newsletter: true },
    products_per_section: 8,
  },
  navigation: {
    header_menu: [{ label: 'Shop', url: '/products' }],
    footer_menus: [{ title: 'Help', links: [{ label: 'Contact', url: '/pages/contact' }] }],
  },
  checkout: {
    guest_checkout: true,
    tax_rate: 0,
    tax_inclusive: false,
    min_order_amount: 0,
    cod_enabled: true,
    manual_payment_enabled: true,
    manual_payment_instructions: '',
    terms_page_slug: 'terms',
  },
  notifications: { admin_order_email: '', low_stock_alerts: true, customer_order_emails: true },
});

export const SETTINGS_GROUPS = Object.keys(SETTINGS_DEFAULTS);

/** Defaults personalised with the store name (used when provisioning a new tenant). */
export function defaultSettingsFor(storeName, email = '') {
  const year = new Date().getFullYear();
  return {
    ...structuredClone(SETTINGS_DEFAULTS),
    general: { ...SETTINGS_DEFAULTS.general, store_name: storeName, contact_email: email },
    theme: { ...SETTINGS_DEFAULTS.theme, footer_text: `© ${year} ${storeName}. All rights reserved.` },
    seo: { ...SETTINGS_DEFAULTS.seo, meta_title: storeName, title_template: `%s | ${storeName}` },
    notifications: { ...SETTINGS_DEFAULTS.notifications, admin_order_email: email },
  };
}
