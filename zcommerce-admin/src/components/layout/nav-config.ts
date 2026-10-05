import type { IconType } from "react-icons";
import {
  TbBell,
  TbBox,
  TbBuildingStore,
  TbCalendarDollar,
  TbCategory,
  TbChartBar,
  TbCreditCard,
  TbFileInvoice,
  TbFileText,
  TbHistory,
  TbLayoutDashboard,
  TbPackages,
  TbSettings,
  TbShieldLock,
  TbShoppingCart,
  TbStar,
  TbTag,
  TbTicket,
  TbTruckDelivery,
  TbUserCog,
  TbUsers,
  TbUsersGroup,
  TbStack2,
} from "react-icons/tb";

export interface NavItem {
  label: string;
  to: string;
  icon: IconType;
  perm?: string;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const merchantNav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/", icon: TbLayoutDashboard, perm: "dashboard.view", end: true },
      { label: "Reports", to: "/reports", icon: TbChartBar, perm: "reports.view" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", to: "/orders", icon: TbShoppingCart, perm: "orders.view" },
      { label: "Payments", to: "/payments", icon: TbCreditCard, perm: "payments.view" },
      { label: "Customers", to: "/customers", icon: TbUsers, perm: "customers.view" },
      { label: "Coupons", to: "/coupons", icon: TbTicket, perm: "coupons.view" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", to: "/products", icon: TbBox, perm: "products.view" },
      { label: "Categories", to: "/categories", icon: TbCategory, perm: "categories.view" },
      { label: "Brands", to: "/brands", icon: TbTag, perm: "brands.view" },
      { label: "Inventory", to: "/inventory", icon: TbPackages, perm: "inventory.view" },
      { label: "Reviews", to: "/reviews", icon: TbStar, perm: "reviews.view" },
    ],
  },
  {
    label: "Store",
    items: [
      { label: "Shipping", to: "/shipping", icon: TbTruckDelivery, perm: "shipping.view" },
      { label: "Pages", to: "/pages", icon: TbFileText, perm: "pages.view" },
      { label: "Settings", to: "/settings", icon: TbSettings, perm: "settings.view" },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Notifications", to: "/notifications", icon: TbBell, perm: "notifications.view" },
      { label: "Staff", to: "/staff", icon: TbUserCog, perm: "users.view" },
      { label: "Roles", to: "/roles", icon: TbShieldLock, perm: "roles.view" },
    ],
  },
];

export const systemNav: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/system", icon: TbLayoutDashboard, perm: "dashboard.view", end: true }],
  },
  {
    label: "Business",
    items: [
      { label: "Tenants", to: "/system/tenants", icon: TbBuildingStore, perm: "tenants.view" },
      { label: "Plans", to: "/system/plans", icon: TbStack2, perm: "plans.view" },
      { label: "Subscriptions", to: "/system/subscriptions", icon: TbCalendarDollar, perm: "subscriptions.view" },
      { label: "Invoices", to: "/system/invoices", icon: TbFileInvoice, perm: "billing.view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", to: "/system/users", icon: TbUsersGroup, perm: "users.view" },
      { label: "Roles", to: "/system/roles", icon: TbShieldLock, perm: "roles.view" },
      { label: "Audit logs", to: "/system/audit-logs", icon: TbHistory, perm: "audit_logs.view" },
    ],
  },
];

