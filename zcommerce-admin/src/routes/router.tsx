import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { AppShell } from "@/components/layout/app-shell";
import { merchantNav, systemNav } from "@/components/layout/nav-config";
import { FullPageLoader } from "@/components/common/loaders";
import { LoginPage } from "@/features/auth/login-page";
import { Forbidden, NotFound, RequireAuth, RequirePermission } from "@/routes/guards";
import { usePermissions } from "@/hooks/use-auth";

/** Lazy-load a named export. */
function lz<T extends Record<string, unknown>>(loader: () => Promise<T>, name: keyof T) {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[name] as ComponentType };
  });
}

const DashboardPage = lz(() => import("@/features/dashboard/dashboard-page"), "DashboardPage");
const ProductsPage = lz(() => import("@/features/products/products-page"), "ProductsPage");
const ProductFormPage = lz(() => import("@/features/products/product-form-page"), "ProductFormPage");
const CategoriesPage = lz(() => import("@/features/categories/categories-page"), "CategoriesPage");
const BrandsPage = lz(() => import("@/features/brands/brands-page"), "BrandsPage");
const CustomersPage = lz(() => import("@/features/customers/customers-page"), "CustomersPage");
const CustomerDetailPage = lz(() => import("@/features/customers/customer-detail-page"), "CustomerDetailPage");
const OrdersPage = lz(() => import("@/features/orders/orders-page"), "OrdersPage");
const OrderDetailPage = lz(() => import("@/features/orders/order-detail-page"), "OrderDetailPage");
const PaymentsPage = lz(() => import("@/features/payments/payments-page"), "PaymentsPage");
const InventoryPage = lz(() => import("@/features/inventory/inventory-page"), "InventoryPage");
const ShippingPage = lz(() => import("@/features/shipping/shipping-page"), "ShippingPage");
const CouponsPage = lz(() => import("@/features/coupons/coupons-page"), "CouponsPage");
const ReviewsPage = lz(() => import("@/features/reviews/reviews-page"), "ReviewsPage");
const PagesPage = lz(() => import("@/features/pages/pages-page"), "PagesPage");
const PageFormPage = lz(() => import("@/features/pages/page-form-page"), "PageFormPage");
const ReportsPage = lz(() => import("@/features/reports/reports-page"), "ReportsPage");
const NotificationsPage = lz(() => import("@/features/notifications/notifications-page"), "NotificationsPage");
const UsersPage = lz(() => import("@/features/users/users-page"), "UsersPage");
const RolesPage = lz(() => import("@/features/roles/roles-page"), "RolesPage");
const ProfilePage = lz(() => import("@/features/profile/profile-page"), "ProfilePage");
const SettingsPage = lz(() => import("@/features/settings/settings-page"), "SettingsPage");

const SystemDashboardPage = lz(() => import("@/features/system/dashboard-page"), "SystemDashboardPage");
const TenantsPage = lz(() => import("@/features/system/tenants/tenants-page"), "TenantsPage");
const TenantFormPage = lz(() => import("@/features/system/tenants/tenant-form-page"), "TenantFormPage");
const PlansPage = lz(() => import("@/features/system/plans-page"), "PlansPage");
const SubscriptionsPage = lz(() => import("@/features/system/subscriptions-page"), "SubscriptionsPage");
const InvoicesPage = lz(() => import("@/features/system/invoices-page"), "InvoicesPage");
const AuditLogsPage = lz(() => import("@/features/system/audit-logs-page"), "AuditLogsPage");
const SystemProfilePage = lz(() => import("@/features/system/system-profile-page"), "SystemProfilePage");

function S({ children }: { children: ReactNode }) {
  return <Suspense fallback={<FullPageLoader />}>{children}</Suspense>;
}

/** Merchant index: dashboard if allowed, otherwise the first page the user may see. */
function MerchantHome() {
  const { can } = usePermissions();
  if (can("dashboard.view")) return <S><DashboardPage /></S>;
  const first = merchantNav.flatMap((g) => g.items).find((i) => i.to !== "/" && can(i.perm));
  return first ? <Navigate to={first.to} replace /> : <Forbidden />;
}

function guarded(perm: string, el: ReactNode) {
  return (
    <RequirePermission perm={perm}>
      <S>{el}</S>
    </RequirePermission>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/system",
    element: (
      <RequireAuth scope="system">
        <AppShell scope="system" nav={systemNav} />
      </RequireAuth>
    ),
    children: [
      { index: true, element: guarded("dashboard.view", <SystemDashboardPage />) },
      { path: "tenants", element: guarded("tenants.view", <TenantsPage />) },
      { path: "tenants/new", element: guarded("tenants.create", <TenantFormPage />) },
      { path: "tenants/:id", element: guarded("tenants.update", <TenantFormPage />) },
      { path: "plans", element: guarded("plans.view", <PlansPage />) },
      { path: "subscriptions", element: guarded("subscriptions.view", <SubscriptionsPage />) },
      { path: "invoices", element: guarded("billing.view", <InvoicesPage />) },
      { path: "users", element: guarded("users.view", <UsersPage />) },
      { path: "roles", element: guarded("roles.view", <RolesPage />) },
      { path: "audit-logs", element: guarded("audit_logs.view", <AuditLogsPage />) },
      { path: "profile", element: <S><SystemProfilePage /></S> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "/",
    element: (
      <RequireAuth scope="tenant">
        <AppShell scope="tenant" nav={merchantNav} />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <MerchantHome /> },
      { path: "products", element: guarded("products.view", <ProductsPage />) },
      { path: "products/new", element: guarded("products.create", <ProductFormPage />) },
      { path: "products/:id", element: guarded("products.view", <ProductFormPage />) },
      { path: "categories", element: guarded("categories.view", <CategoriesPage />) },
      { path: "brands", element: guarded("brands.view", <BrandsPage />) },
      { path: "customers", element: guarded("customers.view", <CustomersPage />) },
      { path: "customers/:id", element: guarded("customers.view", <CustomerDetailPage />) },
      { path: "orders", element: guarded("orders.view", <OrdersPage />) },
      { path: "orders/:id", element: guarded("orders.view", <OrderDetailPage />) },
      { path: "payments", element: guarded("payments.view", <PaymentsPage />) },
      { path: "inventory", element: guarded("inventory.view", <InventoryPage />) },
      { path: "shipping", element: guarded("shipping.view", <ShippingPage />) },
      { path: "coupons", element: guarded("coupons.view", <CouponsPage />) },
      { path: "reviews", element: guarded("reviews.view", <ReviewsPage />) },
      { path: "pages", element: guarded("pages.view", <PagesPage />) },
      { path: "pages/new", element: guarded("pages.create", <PageFormPage />) },
      { path: "pages/:id", element: guarded("pages.view", <PageFormPage />) },
      { path: "reports", element: guarded("reports.view", <ReportsPage />) },
      { path: "notifications", element: guarded("notifications.view", <NotificationsPage />) },
      { path: "staff", element: guarded("users.view", <UsersPage />) },
      { path: "roles", element: guarded("roles.view", <RolesPage />) },
      { path: "settings", element: guarded("settings.view", <SettingsPage />) },
      { path: "profile", element: <S><ProfilePage /></S> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
