const group = (resource, actions) => ({ group: resource, keys: actions.map((a) => `${resource}.${a}`) });

export const TENANT_PERMISSION_GROUPS = [
  group('dashboard', ['view']),
  group('products', ['view', 'create', 'update', 'delete']),
  group('categories', ['view', 'create', 'update', 'delete']),
  group('brands', ['view', 'create', 'update', 'delete']),
  group('customers', ['view', 'create', 'update', 'delete']),
  group('orders', ['view', 'update']),
  group('payments', ['view', 'update']),
  group('inventory', ['view', 'update']),
  group('shipping', ['view', 'create', 'update', 'delete']),
  group('coupons', ['view', 'create', 'update', 'delete']),
  group('reviews', ['view', 'update', 'delete']),
  group('pages', ['view', 'create', 'update', 'delete']),
  group('reports', ['view']),
  group('notifications', ['view']),
  group('settings', ['view', 'update']),
  group('users', ['view', 'create', 'update', 'delete']),
  group('roles', ['view', 'create', 'update', 'delete']),
];

export const SYSTEM_PERMISSION_GROUPS = [
  group('dashboard', ['view']),
  group('tenants', ['view', 'create', 'update', 'delete']),
  group('plans', ['view', 'create', 'update', 'delete']),
  group('subscriptions', ['view', 'create', 'update']),
  group('billing', ['view', 'update']),
  group('users', ['view', 'create', 'update', 'delete']),
  group('roles', ['view', 'create', 'update', 'delete']),
  group('audit_logs', ['view']),
];

export const TENANT_PERMISSIONS = TENANT_PERMISSION_GROUPS.flatMap((g) => g.keys);
export const SYSTEM_PERMISSIONS = SYSTEM_PERMISSION_GROUPS.flatMap((g) => g.keys);

/** Default roles created for every new tenant. */
export const DEFAULT_TENANT_ROLES = [
  { name: 'Owner', description: 'Full access to the store', permissions: ['*'], is_system: true },
  {
    name: 'Manager',
    description: 'Manage catalog, orders, customers and content',
    permissions: TENANT_PERMISSIONS.filter((p) => !p.startsWith('roles.') && !['users.delete', 'settings.update'].includes(p)),
    is_system: true,
  },
  {
    name: 'Staff',
    description: 'Process orders and view the catalog',
    permissions: [
      'dashboard.view',
      'products.view',
      'categories.view',
      'brands.view',
      'customers.view',
      'orders.view',
      'orders.update',
      'payments.view',
      'inventory.view',
      'reviews.view',
      'notifications.view',
    ],
    is_system: true,
  },
];
