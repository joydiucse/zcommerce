import { Router } from 'express';
import { requireTenantAuth } from '../app/middleware/tenant.middleware.js';
import tenantAuthRoutes from '../modules/tenant/auth/auth.routes.js';
import dashboardRoutes from '../modules/tenant/reports/dashboard.routes.js';
import tenantUserRoutes from '../modules/tenant/users/user.routes.js';
import tenantRoleRoutes from '../modules/tenant/roles/role.routes.js';
import tenantPermissionRoutes from '../modules/tenant/permissions/permission.routes.js';
import productRoutes from '../modules/tenant/products/product.routes.js';
import reviewRoutes from '../modules/tenant/products/review.routes.js';
import categoryRoutes from '../modules/tenant/categories/category.routes.js';
import brandRoutes from '../modules/tenant/brands/brand.routes.js';
import customerRoutes from '../modules/tenant/customers/customer.routes.js';
import orderRoutes from '../modules/tenant/orders/order.routes.js';
import paymentRoutes from '../modules/tenant/payments/payment.routes.js';
import inventoryRoutes from '../modules/tenant/inventory/inventory.routes.js';
import shippingRoutes from '../modules/tenant/shipping/shipping.routes.js';
import couponRoutes from '../modules/tenant/coupons/coupon.routes.js';
import pageRoutes from '../modules/tenant/settings/page.routes.js';
import reportRoutes from '../modules/tenant/reports/report.routes.js';
import notificationRoutes from '../modules/tenant/notifications/notification.routes.js';
import settingRoutes from '../modules/tenant/settings/setting.routes.js';
import uploadRoutes from '../modules/tenant/settings/upload.routes.js';
import { storefrontRevalidateMiddleware } from '../shared/helpers/storefront-revalidate.js';

/** /api/v1/tenant/* — merchant staff (aud=tenant, tenant from JWT). */
export default function tenantRoutes(container) {
  const r = Router();
  r.use('/auth', tenantAuthRoutes(container));

  r.use(requireTenantAuth());
  r.use(storefrontRevalidateMiddleware());
  r.use('/dashboard', dashboardRoutes(container));
  r.use('/users', tenantUserRoutes(container));
  r.use('/roles', tenantRoleRoutes(container));
  r.use('/permissions', tenantPermissionRoutes(container));
  r.use('/products', productRoutes(container));
  r.use('/categories', categoryRoutes(container));
  r.use('/brands', brandRoutes(container));
  r.use('/customers', customerRoutes(container));
  r.use('/orders', orderRoutes(container));
  r.use('/payments', paymentRoutes(container));
  r.use('/inventory', inventoryRoutes(container));
  r.use('/shipping', shippingRoutes(container));
  r.use('/coupons', couponRoutes(container));
  r.use('/reviews', reviewRoutes(container));
  r.use('/pages', pageRoutes(container));
  r.use('/reports', reportRoutes(container));
  r.use('/notifications', notificationRoutes(container));
  r.use('/settings', settingRoutes(container));
  r.use('/uploads', uploadRoutes(container));
  return r;
}
