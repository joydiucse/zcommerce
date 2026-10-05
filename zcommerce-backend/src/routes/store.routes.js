import { Router } from 'express';
import { storeTenant } from '../app/middleware/store.middleware.js';
import storefrontRoutes, { platformRoutes } from '../modules/store/storefront/store.routes.js';
import storeProductRoutes from '../modules/store/products/product.routes.js';
import storeCategoryRoutes from '../modules/store/categories/category.routes.js';
import storeBrandRoutes from '../modules/store/brands/brand.routes.js';
import searchRoutes from '../modules/store/search/search.routes.js';
import storePageRoutes from '../modules/store/pages/page.routes.js';
import cartRoutes from '../modules/store/cart/cart.routes.js';
import checkoutRoutes from '../modules/store/checkout/checkout.routes.js';
import storeCustomerRoutes from '../modules/store/customers/customer.routes.js';
import storeOrderRoutes from '../modules/store/orders/order.routes.js';

/** /api/v1/store/* — public storefront; tenant from X-Tenant / X-Store-Domain / Host. */
export default function storeRoutes(container) {
  const r = Router();
  r.use('/', platformRoutes(container));
  r.use(storeTenant());
  r.use('/', storefrontRoutes(container));
  r.use('/products', storeProductRoutes(container));
  r.use('/categories', storeCategoryRoutes(container));
  r.use('/brands', storeBrandRoutes(container));
  r.use('/search', searchRoutes(container));
  r.use('/pages', storePageRoutes(container));
  r.use('/cart', cartRoutes(container));
  r.use('/checkout', checkoutRoutes(container));
  r.use('/customers', storeCustomerRoutes(container));
  r.use('/orders', storeOrderRoutes(container));
  return r;
}
