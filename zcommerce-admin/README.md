# zCommerce Admin

Admin panel for the zCommerce multi-tenant e-commerce platform. One app, two scopes:

- **Merchant admin** (`/`): store staff manage the catalog, orders, customers, content and storefront settings. Uses the `/tenant/*` API.
- **Platform admin** (`/system/*`): super-admins manage tenants, plans, subscriptions, invoices, system users and audit logs. Uses the `/system/*` API.

The API contract is in [`../CONTRACT.md`](../CONTRACT.md).

## Stack

Vite, React 19, TypeScript (strict), Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui components on Radix primitives (`radix-ui`), TanStack Table v8, TanStack Query v5, react-router v7, react-hook-form with zod, axios, sonner, recharts, TipTap (StarterKit) and react-icons.

## Getting started

Requirements: Node 22+ and npm 10+. The backend should be running on `http://localhost:4000` (see `../zcommerce-backend`).

```bash
cd zcommerce-admin
cp .env.example .env      # edit if your API runs elsewhere
npm install
npm run dev               # http://localhost:5173
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run build` | Type-checks (`tsc -b`) and builds to `dist/` |
| `npm run preview` | Serves the production build |
| `npm run typecheck` | Type-check only |

### Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:4000/api/v1` | Backend base URL |
| `VITE_STORE_URL` | `http://localhost:3001` | Storefront URL used by the "View store" and preview links |

### Demo credentials (from the backend seed)

The login form fills these in automatically in dev mode.

- Merchant: store `demo`, `owner@demo.test` / `password123`
- Platform: `admin@zcommerce.test` / `password123`

## How it works

- **Auth.** Each scope keeps its own tokens in localStorage (`zc.auth.tenant` / `zc.auth.system`), so you can be signed in to both at once. Each scope has its own axios instance (`src/lib/api.ts`) with base URL `${VITE_API_URL}/<scope>`. The instance attaches the Bearer token. On a 401 it refreshes once via `/<scope>/auth/refresh`; concurrent requests share the same in-flight refresh. If the refresh fails, it logs out.
- **Permissions.** `/auth/me` is loaded by the route guard. Routes, nav items and action buttons are hidden or blocked unless the user holds the key. `*` and `<resource>.*` wildcards are supported (`src/lib/permissions.ts`, `<Can perm="…">`, `usePermissions()`).
- **Data grids.** `DataTable` (`src/components/data-table`) is built on TanStack Table and is fully server-driven. It handles `?page&limit&search&sort&order` plus filter dropdowns, column visibility (persisted per table), row selection with bulk actions, skeleton loading, empty states and a page-size select. All table state lives in the URL (`useTableState`). Data comes from `useListQuery(resourcePath, params)`.
- **Errors.** API validation `details` are mapped onto form fields (`applyApiErrors`). Other errors are shown as toasts.
- **Money.** `useMoney()` formats amounts with `settings.general.currency` and `locale`.
- **Settings.** Each tab edits one group from CONTRACT §4 and saves it with `PUT /tenant/settings/:group`, sending the full group object. These settings drive the Next.js storefront.

## Project layout

```
src/
  components/
    ui/            shadcn/ui components (Radix + cva + tailwind-merge, react-icons)
    data-table/    DataTable, pagination, column header, view options, row actions, SimpleTable
    forms/         typed react-hook-form field helpers, FormDialog, FormSection
    common/        ImageUpload, MoneyInput, StatusBadge, ConfirmDialog, RichTextEditor, charts, SEO previews, JSON diff…
    layout/        AppShell (sidebar, mobile sheet, topbar, search, notifications, theme, user menu)
  features/        one folder per resource (pages, dialogs, columns, api hooks)
    system/        platform-admin pages
  hooks/           useListQuery & mutations, useTableState, useMe/usePermissions, useMoney, theme
  lib/             api client, auth store, errors, format, permissions, utils
  routes/          router + guards
  types/           TypeScript types mirroring the contract
```
