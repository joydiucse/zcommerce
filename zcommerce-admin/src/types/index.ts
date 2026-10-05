/* Types mirroring CONTRACT.md shapes (snake_case). */

export type ID = string;

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  [key: string]: string | number | boolean | undefined;
}

export type Scope = "tenant" | "system";

export interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RoleRef {
  id: ID;
  name: string;
}

export interface AuthUser {
  id: ID;
  name: string;
  email: string;
  avatar_url?: string | null;
  role?: RoleRef | null;
  role_id?: ID | null;
  status?: string;
}

export interface TenantRef {
  id: ID;
  name: string;
  slug: string;
  status: TenantStatus;
  custom_domain: string | null;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
  tenant?: TenantRef;
  permissions: string[];
}

export interface PermissionGroup {
  group: string;
  keys: string[];
}

export interface Address {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

/* ---------------- System ---------------- */

export type TenantStatus = "trial" | "active" | "suspended";

export interface PlanLimits {
  products: number;
  staff: number;
  storage_mb: number;
}

export interface Plan extends Timestamps {
  id: ID;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  limits: PlanLimits;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface Tenant extends Timestamps {
  id: ID;
  name: string;
  slug: string;
  custom_domain: string | null;
  email: string;
  phone: string | null;
  status: TenantStatus;
  plan_id: ID | null;
  plan?: { id: ID; name: string } | null;
  trial_ends_at: string | null;
  owner_id: ID | null;
}

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";
export type BillingCycle = "monthly" | "yearly";

export interface Subscription extends Timestamps {
  id: ID;
  tenant_id: ID;
  plan_id: ID;
  tenant?: { id: ID; name: string; slug?: string } | null;
  plan?: { id: ID; name: string } | null;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  amount: number;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
}

export type InvoiceStatus = "draft" | "open" | "paid" | "void";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount?: number;
}

export interface Invoice extends Timestamps {
  id: ID;
  tenant_id: ID;
  tenant?: { id: ID; name: string; slug?: string } | null;
  subscription_id: ID | null;
  number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  items: InvoiceItem[];
}

export interface SystemRole extends Timestamps {
  id: ID;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
}

export type UserStatus = "active" | "disabled";

export interface SystemUser extends Timestamps {
  id: ID;
  name: string;
  email: string;
  role_id: ID | null;
  role?: RoleRef | null;
  status: UserStatus;
  last_login_at: string | null;
}

export interface AuditLog extends Timestamps {
  id: ID;
  actor_type: "system" | "tenant";
  actor_id: ID | null;
  actor?: { id: ID; name: string; email?: string } | null;
  tenant_id: ID | null;
  tenant?: { id: ID; name: string } | null;
  action: string;
  entity_type: string | null;
  entity_id: ID | null;
  changes: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
}

export interface SystemDashboard {
  tenants_total: number;
  tenants_active: number;
  tenants_trial: number;
  mrr: number;
  invoices_open_amount: number;
  recent_tenants: Tenant[];
  tenants_by_month: { month: string; count: number }[];
}

/* ---------------- Tenant ---------------- */

export interface Role extends Timestamps {
  id: ID;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
}

export interface StaffUser extends Timestamps {
  id: ID;
  name: string;
  email: string;
  role_id: ID | null;
  role?: RoleRef | null;
  status: UserStatus;
  avatar_url: string | null;
  last_login_at: string | null;
}

export interface Category extends Timestamps {
  id: ID;
  parent_id: ID | null;
  parent?: { id: ID; name: string } | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  meta_title: string | null;
  meta_description: string | null;
  product_count?: number;
  products_count?: number;
}

export interface Brand extends Timestamps {
  id: ID;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  product_count?: number;
  products_count?: number;
}

export type ProductStatus = "draft" | "active" | "archived";

export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Product extends Timestamps {
  id: ID;
  category_id: ID | null;
  brand_id: ID | null;
  category?: { id: ID; name: string } | null;
  brand?: { id: ID; name: string } | null;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  status: ProductStatus;
  is_featured: boolean;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  weight: number | null;
  images: ProductImage[];
  attributes: ProductAttribute[];
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  rating_avg: number;
  rating_count: number;
  published_at: string | null;
}

export type MovementType = "adjustment" | "sale" | "return" | "restock";

export interface InventoryMovement extends Timestamps {
  id: ID;
  product_id: ID;
  product?: { id: ID; name: string; sku?: string | null } | null;
  type: MovementType;
  quantity: number;
  reason: string | null;
  reference: string | null;
  created_by: ID | null;
  created_by_user?: { id: ID; name: string } | null;
  created_by_name?: string | null;
}

export interface Customer extends Timestamps {
  id: ID;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  accepts_marketing: boolean;
  addresses: Address[];
  orders_count: number;
  total_spent: number;
  last_order_at: string | null;
  recent_orders?: Order[];
}

export type ShippingType = "flat" | "free" | "free_over";

export interface ShippingMethod extends Timestamps {
  id: ID;
  name: string;
  description: string | null;
  type: ShippingType;
  rate: number;
  free_over_amount: number | null;
  estimated_days: string | null;
  is_active: boolean;
  sort_order: number;
}

export type CouponType = "percent" | "fixed" | "free_shipping";

export interface Coupon extends Timestamps {
  id: ID;
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cod" | "manual";

export interface OrderItem {
  id: ID;
  product_id: ID | null;
  name: string;
  sku: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderHistory {
  id: ID;
  status: string;
  note: string | null;
  created_by: ID | null;
  created_by_user?: { id: ID; name: string } | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface Payment extends Timestamps {
  id: ID;
  order_id: ID;
  order?: { id: ID; order_number: string } | null;
  order_number?: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transaction_ref: string | null;
  paid_at: string | null;
}

export interface Order extends Timestamps {
  id: ID;
  customer_id: ID | null;
  customer?: { id: ID; name: string; email: string; phone?: string | null } | null;
  order_number: string;
  email: string;
  phone: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: "unfulfilled" | "fulfilled";
  currency: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  coupon_code: string | null;
  shipping_method_id: ID | null;
  shipping_method_name: string | null;
  shipping_address: Address | null;
  billing_address: Address | null;
  payment_method: PaymentMethod;
  notes: string | null;
  tracking_number: string | null;
  placed_at: string | null;
  cancelled_at: string | null;
  items?: OrderItem[];
  items_count?: number;
  history?: OrderHistory[];
  payments?: Payment[];
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review extends Timestamps {
  id: ID;
  product_id: ID;
  product?: { id: ID; name: string; slug?: string } | null;
  customer_id: ID | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
}

export interface CmsPage extends Timestamps {
  id: ID;
  title: string;
  slug: string;
  content: string | null;
  is_published: boolean;
  show_in_footer: boolean;
  meta_title: string | null;
  meta_description: string | null;
}

export interface AppNotification extends Timestamps {
  id: ID;
  user_id: ID | null;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
}

export interface TenantDashboard {
  revenue_today: number;
  revenue_month: number;
  orders_today: number;
  orders_month: number;
  customers_total: number;
  products_total: number;
  low_stock_count: number;
  pending_orders: number;
  sales_chart: { date: string; revenue: number; orders: number }[];
  top_products: { id: ID; name: string; quantity: number; revenue: number }[];
  recent_orders: Order[];
}

export interface SalesReport {
  summary: { revenue: number; orders: number; average_order_value: number; items_sold: number };
  series: { period: string; revenue: number; orders: number }[];
}

export interface ProductReportRow {
  id?: ID;
  product_id?: ID;
  name: string;
  sku?: string | null;
  quantity: number;
  revenue: number;
  orders?: number;
}

export interface CustomerReportRow {
  id?: ID;
  customer_id?: ID;
  name: string;
  email: string;
  orders: number;
  revenue?: number;
  total_spent?: number;
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  mime: string;
}

/* ---------------- Settings (§4) ---------------- */

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

export type BorderRadius = "none" | "sm" | "md" | "lg" | "full";

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
  image_url: string | null;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
}

export interface HomepageSettings {
  announcement_bar: { enabled: boolean; text: string; link: string };
  hero_slides: HeroSlide[];
  featured_category_ids: ID[];
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

export interface NotificationSettings {
  admin_order_email: string;
  low_stock_alerts: boolean;
  customer_order_emails: boolean;
}

export interface TenantSettings {
  general: GeneralSettings;
  theme: ThemeSettings;
  seo: SeoSettings;
  social: SocialSettings;
  homepage: HomepageSettings;
  navigation: NavigationSettings;
  checkout: CheckoutSettings;
  notifications: NotificationSettings;
}

export type SettingsGroup = keyof TenantSettings;
