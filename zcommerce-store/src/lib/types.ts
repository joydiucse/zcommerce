// Types mirroring CONTRACT.md (snake_case, store scope).

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: { path: string; message: string }[];
}

export interface Envelope<T> {
  success: boolean;
  data?: T;
  meta?: ApiMeta;
  error?: ApiErrorBody;
}

export type BorderRadius = "none" | "sm" | "md" | "lg" | "full";

export interface GeneralSettings {
  store_name: string;
  tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  contact_email: string;
  contact_phone: string;
  address: string;
  currency: string;
  currency_symbol: string;
  locale: string;
  timezone: string;
}

export interface ThemeSettings {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  border_radius: BorderRadius;
  footer_text: string;
}

export interface SeoSettings {
  meta_title: string;
  title_template: string;
  meta_description: string;
  meta_keywords: string;
  og_image_url: string | null;
  twitter_handle: string;
  canonical_url: string;
  robots_index: boolean;
  google_site_verification: string;
  bing_site_verification: string;
  google_analytics_id: string;
  gtm_id: string;
  facebook_pixel_id: string;
  organization_schema: boolean;
}

export interface SocialSettings {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  tiktok: string;
  linkedin: string;
}

export interface HeroSlide {
  image_url: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
}

export interface HomepageSettings {
  announcement_bar: { enabled: boolean; text: string; link: string };
  hero_slides: HeroSlide[];
  featured_category_ids: string[];
  sections: {
    featured_products: boolean;
    new_arrivals: boolean;
    categories: boolean;
    brands: boolean;
    newsletter: boolean;
  };
  products_per_section: number;
}

export interface MenuLink {
  label: string;
  url: string;
}

export interface NavigationSettings {
  header_menu: MenuLink[];
  footer_menus: { title: string; links: MenuLink[] }[];
}

export interface CheckoutSettings {
  guest_checkout: boolean;
  tax_rate: number;
  tax_inclusive: boolean;
  min_order_amount: number;
  cod_enabled: boolean;
  manual_payment_enabled: boolean;
  manual_payment_instructions: string;
  terms_page_slug: string;
}

export interface StoreSettings {
  general: GeneralSettings;
  theme: ThemeSettings;
  seo: SeoSettings;
  social: SocialSettings;
  homepage: HomepageSettings;
  navigation: NavigationSettings;
  checkout: CheckoutSettings;
  tenant: { name: string; slug: string };
  /** Tenant's public URL (site_url / custom domain); null → use the request host. */
  store_url: string | null;
}

export interface ProductImage {
  url: string;
  alt?: string | null;
}

export interface Ref {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  images: ProductImage[];
  category: Ref | null;
  brand: Ref | null;
  in_stock: boolean;
  stock_quantity: number;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  updated_at: string;
}

export interface ProductDetail extends Product {
  description: string | null;
  attributes: { name: string; value: string }[];
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  related: Product[];
}

export interface Review {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  product_count: number;
  description?: string | null;
  children: CategoryNode[];
}

export interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  parent_id?: string | null;
  updated_at?: string;
  product_count?: number;
  children?: CategoryNode[];
  breadcrumbs: { name: string; slug: string }[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  product_count?: number;
  updated_at?: string;
}

export interface PageSummary {
  title: string;
  slug: string;
  show_in_footer: boolean;
}

export interface CmsPage extends PageSummary {
  id?: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  updated_at?: string;
}

export interface SearchResults {
  products: Product[];
  categories: Ref[] | CategoryNode[];
  brands: Brand[];
}

export interface SitemapEntry {
  slug: string;
  updated_at: string;
}

export interface SitemapData {
  products: SitemapEntry[];
  categories: SitemapEntry[];
  brands: SitemapEntry[];
  pages: SitemapEntry[];
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  sku: string | null;
  image_url: string | null;
  price: number;
  quantity: number;
  line_total: number;
  in_stock: boolean;
  max_quantity: number;
}

export interface Cart {
  token: string;
  items: CartItem[];
  item_count: number;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  coupon: { code: string; type: string; value: number } | null;
  currency: string;
}

export interface Address {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  type: "flat" | "free" | "free_over";
  rate?: number;
  free_over_amount?: number | null;
  estimated_days: string | null;
  cost: number;
}

export interface OrderItem {
  name: string;
  sku: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status?: string;
  email: string;
  phone: string | null;
  currency: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  coupon_code: string | null;
  shipping_method_name: string | null;
  shipping_address: Address | null;
  billing_address: Address | null;
  payment_method: "cod" | "manual";
  notes: string | null;
  tracking_number: string | null;
  items: OrderItem[];
  placed_at: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  accepts_marketing?: boolean;
  addresses: Address[];
  orders_count?: number;
  total_spent?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: Customer;
}

/** GET /store/platform — shown on hosts that don't belong to any store. */
export interface PlatformPlan {
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
}

export interface PlatformInfo {
  name: string;
  tagline: string;
  admin_url: string;
  support_email: string | null;
  plans: PlatformPlan[];
}
