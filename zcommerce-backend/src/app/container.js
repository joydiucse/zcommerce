/**
 * Tiny DI container. Registrations are explicit: repositories -> services -> controllers.
 * Each factory receives the container (a lazy proxy), so dependencies are resolved by name
 * on first use and every instance is a singleton.
 */

// ---- system
import { SystemAuthRepository } from '../modules/system/auth/auth.repository.js';
import { SystemAuthService } from '../modules/system/auth/auth.service.js';
import { SystemAuthController } from '../modules/system/auth/auth.controller.js';
import { SystemUserRepository } from '../modules/system/users/user.repository.js';
import { SystemUserService } from '../modules/system/users/user.service.js';
import { SystemUserController } from '../modules/system/users/user.controller.js';
import { SystemRoleRepository } from '../modules/system/roles/role.repository.js';
import { SystemRoleService } from '../modules/system/roles/role.service.js';
import { SystemRoleController } from '../modules/system/roles/role.controller.js';
import { SystemPermissionRepository } from '../modules/system/permissions/permission.repository.js';
import { SystemPermissionService } from '../modules/system/permissions/permission.service.js';
import { SystemPermissionController } from '../modules/system/permissions/permission.controller.js';
import { TenantRepository } from '../modules/system/tenants/tenant.repository.js';
import { TenantService } from '../modules/system/tenants/tenant.service.js';
import { TenantController } from '../modules/system/tenants/tenant.controller.js';
import { PlanRepository } from '../modules/system/plans/plan.repository.js';
import { PlanService } from '../modules/system/plans/plan.service.js';
import { PlanController } from '../modules/system/plans/plan.controller.js';
import { SubscriptionRepository } from '../modules/system/subscriptions/subscription.repository.js';
import { SubscriptionService } from '../modules/system/subscriptions/subscription.service.js';
import { SubscriptionController } from '../modules/system/subscriptions/subscription.controller.js';
import { InvoiceRepository } from '../modules/system/billing/billing.repository.js';
import { BillingService } from '../modules/system/billing/billing.service.js';
import { BillingController } from '../modules/system/billing/billing.controller.js';
import { AuditLogRepository } from '../modules/system/audit-logs/audit-log.repository.js';
import { AuditLogService } from '../modules/system/audit-logs/audit-log.service.js';
import { AuditLogController } from '../modules/system/audit-logs/audit-log.controller.js';

// ---- tenant
import { TenantAuthRepository } from '../modules/tenant/auth/auth.repository.js';
import { TenantAuthService } from '../modules/tenant/auth/auth.service.js';
import { TenantAuthController } from '../modules/tenant/auth/auth.controller.js';
import { TenantUserRepository } from '../modules/tenant/users/user.repository.js';
import { TenantUserService } from '../modules/tenant/users/user.service.js';
import { TenantUserController } from '../modules/tenant/users/user.controller.js';
import { TenantRoleRepository } from '../modules/tenant/roles/role.repository.js';
import { TenantRoleService } from '../modules/tenant/roles/role.service.js';
import { TenantRoleController } from '../modules/tenant/roles/role.controller.js';
import { TenantPermissionRepository } from '../modules/tenant/permissions/permission.repository.js';
import { TenantPermissionService } from '../modules/tenant/permissions/permission.service.js';
import { TenantPermissionController } from '../modules/tenant/permissions/permission.controller.js';
import { ProductRepository } from '../modules/tenant/products/product.repository.js';
import { ProductService } from '../modules/tenant/products/product.service.js';
import { ProductController } from '../modules/tenant/products/product.controller.js';
import { ReviewRepository } from '../modules/tenant/products/review.repository.js';
import { ReviewService } from '../modules/tenant/products/review.service.js';
import { ReviewController } from '../modules/tenant/products/review.controller.js';
import { CategoryRepository } from '../modules/tenant/categories/category.repository.js';
import { CategoryService } from '../modules/tenant/categories/category.service.js';
import { CategoryController } from '../modules/tenant/categories/category.controller.js';
import { BrandRepository } from '../modules/tenant/brands/brand.repository.js';
import { BrandService } from '../modules/tenant/brands/brand.service.js';
import { BrandController } from '../modules/tenant/brands/brand.controller.js';
import { CustomerRepository } from '../modules/tenant/customers/customer.repository.js';
import { CustomerService } from '../modules/tenant/customers/customer.service.js';
import { CustomerController } from '../modules/tenant/customers/customer.controller.js';
import { OrderRepository } from '../modules/tenant/orders/order.repository.js';
import { OrderService } from '../modules/tenant/orders/order.service.js';
import { OrderController } from '../modules/tenant/orders/order.controller.js';
import { PaymentRepository } from '../modules/tenant/payments/payment.repository.js';
import { PaymentService } from '../modules/tenant/payments/payment.service.js';
import { PaymentController } from '../modules/tenant/payments/payment.controller.js';
import { InventoryRepository } from '../modules/tenant/inventory/inventory.repository.js';
import { InventoryService } from '../modules/tenant/inventory/inventory.service.js';
import { InventoryController } from '../modules/tenant/inventory/inventory.controller.js';
import { ShippingMethodRepository } from '../modules/tenant/shipping/shipping.repository.js';
import { ShippingMethodService } from '../modules/tenant/shipping/shipping.service.js';
import { ShippingMethodController } from '../modules/tenant/shipping/shipping.controller.js';
import { CouponRepository } from '../modules/tenant/coupons/coupon.repository.js';
import { CouponService } from '../modules/tenant/coupons/coupon.service.js';
import { CouponController } from '../modules/tenant/coupons/coupon.controller.js';
import { ReportRepository } from '../modules/tenant/reports/report.repository.js';
import { ReportService } from '../modules/tenant/reports/report.service.js';
import { ReportController } from '../modules/tenant/reports/report.controller.js';
import { DashboardService } from '../modules/tenant/reports/dashboard.service.js';
import { DashboardController } from '../modules/tenant/reports/dashboard.controller.js';
import { NotificationRepository } from '../modules/tenant/notifications/notification.repository.js';
import { NotificationService } from '../modules/tenant/notifications/notification.service.js';
import { NotificationController } from '../modules/tenant/notifications/notification.controller.js';
import { SettingRepository } from '../modules/tenant/settings/setting.repository.js';
import { SettingService } from '../modules/tenant/settings/setting.service.js';
import { SettingController } from '../modules/tenant/settings/setting.controller.js';
import { PageRepository } from '../modules/tenant/settings/page.repository.js';
import { PageService } from '../modules/tenant/settings/page.service.js';
import { PageController } from '../modules/tenant/settings/page.controller.js';
import { UploadService } from '../modules/tenant/settings/upload.service.js';
import { UploadController } from '../modules/tenant/settings/upload.controller.js';

// ---- store
import { StorefrontRepository } from '../modules/store/storefront/store.repository.js';
import { StorefrontService } from '../modules/store/storefront/store.service.js';
import { StorefrontController } from '../modules/store/storefront/store.controller.js';
import { StoreProductRepository } from '../modules/store/products/product.repository.js';
import { StoreProductService } from '../modules/store/products/product.service.js';
import { StoreProductController } from '../modules/store/products/product.controller.js';
import { StoreCategoryRepository } from '../modules/store/categories/category.repository.js';
import { StoreCategoryService } from '../modules/store/categories/category.service.js';
import { StoreCategoryController } from '../modules/store/categories/category.controller.js';
import { StoreBrandRepository } from '../modules/store/brands/brand.repository.js';
import { StoreBrandService } from '../modules/store/brands/brand.service.js';
import { StoreBrandController } from '../modules/store/brands/brand.controller.js';
import { SearchRepository } from '../modules/store/search/search.repository.js';
import { SearchService } from '../modules/store/search/search.service.js';
import { SearchController } from '../modules/store/search/search.controller.js';
import { CartRepository } from '../modules/store/cart/cart.repository.js';
import { CartService } from '../modules/store/cart/cart.service.js';
import { CartController } from '../modules/store/cart/cart.controller.js';
import { CheckoutRepository } from '../modules/store/checkout/checkout.repository.js';
import { CheckoutService } from '../modules/store/checkout/checkout.service.js';
import { CheckoutController } from '../modules/store/checkout/checkout.controller.js';
import { StoreOrderRepository } from '../modules/store/orders/order.repository.js';
import { StoreOrderService } from '../modules/store/orders/order.service.js';
import { StoreOrderController } from '../modules/store/orders/order.controller.js';
import { StoreCustomerRepository } from '../modules/store/customers/customer.repository.js';
import { StoreCustomerService } from '../modules/store/customers/customer.service.js';
import { StoreCustomerController } from '../modules/store/customers/customer.controller.js';
import { StoreReviewRepository } from '../modules/store/reviews/review.repository.js';
import { StoreReviewService } from '../modules/store/reviews/review.service.js';
import { StoreReviewController } from '../modules/store/reviews/review.controller.js';
import { StorePageRepository } from '../modules/store/pages/page.repository.js';
import { StorePageService } from '../modules/store/pages/page.service.js';
import { StorePageController } from '../modules/store/pages/page.controller.js';

export function createContainer() {
  const factories = new Map();
  const instances = new Map();

  const container = new Proxy(
    {},
    {
      get(_target, name) {
        if (typeof name !== 'string') return undefined;
        if (instances.has(name)) return instances.get(name);
        const factory = factories.get(name);
        if (!factory) throw new Error(`container: "${name}" is not registered`);
        const instance = factory(container);
        instances.set(name, instance);
        return instance;
      },
      has: (_t, name) => factories.has(name),
    },
  );

  const register = (name, factory) => factories.set(name, factory);
  /** Register repository, service and controller for one module in a single call. */
  const module = (prefix, { repository, service, controller }) => {
    if (repository) register(`${prefix}Repository`, () => new repository());
    if (service) register(`${prefix}Service`, (c) => new service(c));
    if (controller) register(`${prefix}Controller`, (c) => new controller(c));
  };

  // System
  module('systemAuth', { repository: SystemAuthRepository, service: SystemAuthService, controller: SystemAuthController });
  module('systemUser', { repository: SystemUserRepository, service: SystemUserService, controller: SystemUserController });
  module('systemRole', { repository: SystemRoleRepository, service: SystemRoleService, controller: SystemRoleController });
  module('systemPermission', { repository: SystemPermissionRepository, service: SystemPermissionService, controller: SystemPermissionController });
  module('tenant', { repository: TenantRepository, service: TenantService, controller: TenantController });
  module('plan', { repository: PlanRepository, service: PlanService, controller: PlanController });
  module('subscription', { repository: SubscriptionRepository, service: SubscriptionService, controller: SubscriptionController });
  module('invoice', { repository: InvoiceRepository });
  module('billing', { service: BillingService, controller: BillingController });
  module('auditLog', { repository: AuditLogRepository, service: AuditLogService, controller: AuditLogController });

  // Tenant
  module('tenantAuth', { repository: TenantAuthRepository, service: TenantAuthService, controller: TenantAuthController });
  module('tenantUser', { repository: TenantUserRepository, service: TenantUserService, controller: TenantUserController });
  module('tenantRole', { repository: TenantRoleRepository, service: TenantRoleService, controller: TenantRoleController });
  module('tenantPermission', { repository: TenantPermissionRepository, service: TenantPermissionService, controller: TenantPermissionController });
  module('product', { repository: ProductRepository, service: ProductService, controller: ProductController });
  module('review', { repository: ReviewRepository, service: ReviewService, controller: ReviewController });
  module('category', { repository: CategoryRepository, service: CategoryService, controller: CategoryController });
  module('brand', { repository: BrandRepository, service: BrandService, controller: BrandController });
  module('customer', { repository: CustomerRepository, service: CustomerService, controller: CustomerController });
  module('order', { repository: OrderRepository, service: OrderService, controller: OrderController });
  module('payment', { repository: PaymentRepository, service: PaymentService, controller: PaymentController });
  module('inventory', { repository: InventoryRepository, service: InventoryService, controller: InventoryController });
  module('shippingMethod', { repository: ShippingMethodRepository, service: ShippingMethodService, controller: ShippingMethodController });
  module('coupon', { repository: CouponRepository, service: CouponService, controller: CouponController });
  module('report', { repository: ReportRepository, service: ReportService, controller: ReportController });
  module('dashboard', { service: DashboardService, controller: DashboardController });
  module('notification', { repository: NotificationRepository, service: NotificationService, controller: NotificationController });
  module('setting', { repository: SettingRepository, service: SettingService, controller: SettingController });
  module('page', { repository: PageRepository, service: PageService, controller: PageController });
  module('upload', { service: UploadService, controller: UploadController });

  // Store
  module('storefront', { repository: StorefrontRepository, service: StorefrontService, controller: StorefrontController });
  module('storeProduct', { repository: StoreProductRepository, service: StoreProductService, controller: StoreProductController });
  module('storeCategory', { repository: StoreCategoryRepository, service: StoreCategoryService, controller: StoreCategoryController });
  module('storeBrand', { repository: StoreBrandRepository, service: StoreBrandService, controller: StoreBrandController });
  module('search', { repository: SearchRepository, service: SearchService, controller: SearchController });
  module('cart', { repository: CartRepository, service: CartService, controller: CartController });
  module('checkout', { repository: CheckoutRepository, service: CheckoutService, controller: CheckoutController });
  module('storeOrder', { repository: StoreOrderRepository, service: StoreOrderService, controller: StoreOrderController });
  module('storeCustomer', { repository: StoreCustomerRepository, service: StoreCustomerService, controller: StoreCustomerController });
  module('storeReview', { repository: StoreReviewRepository, service: StoreReviewService, controller: StoreReviewController });
  module('storePage', { repository: StorePageRepository, service: StorePageService, controller: StorePageController });

  return container;
}

export const container = createContainer();
export default container;
