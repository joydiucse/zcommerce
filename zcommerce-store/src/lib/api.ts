import "server-only";
import { headers } from "next/headers";
import { DEFAULT_SETTINGS, mergeDefaults } from "./defaults";
import { domainKeyFromHost, hostFromDomainKey, normalizeHost } from "./tenant-key";
import type {
  ApiMeta,
  Brand,
  CategoryDetail,
  CategoryNode,
  CmsPage,
  Envelope,
  PageSummary,
  PlatformInfo,
  Product,
  ProductDetail,
  Review,
  SearchResults,
  SitemapData,
  StoreSettings,
} from "./types";

const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(
  /\/$/,
  "",
);
export const REVALIDATE = Number(process.env.REVALIDATE_SECONDS ?? 60) || 60;

export { domainKeyFromHost, hostFromDomainKey, normalizeHost };

export interface RequestContext {
  /** [domain] route key, e.g. "localhost_3002". */
  domain: string;
  /** Storefront host incl. port, sent as X-Store-Domain; the backend maps it to a tenant. */
  host: string;
}

/**
 * Tenant context for a request. The proxy (src/proxy.ts) rewrites every storefront URL to
 * /<host-key>/<path>, so pages get the host as the [domain] param and stay ISR-cacheable per host.
 * The backend resolves X-Store-Domain against tenants.site_url / custom_domain / <slug>.<base domain>.
 */
export function contextFor(domainParam: string): RequestContext {
  return { domain: domainParam, host: hostFromDomainKey(domainParam || "") };
}

/** For root-level metadata routes (sitemap/robots/manifest) that have no [domain] param. */
export async function contextFromHeaders(): Promise<RequestContext> {
  const h = await headers();
  return contextFor(domainKeyFromHost(h.get("x-forwarded-host") || h.get("host")));
}

/** Backend error codes that mean "no store lives on this host". */
export type StoreUnavailableReason = "not_found" | "suspended";

export function unavailableReason(code?: string): StoreUnavailableReason | null {
  if (code === "TENANT_NOT_FOUND") return "not_found";
  if (code === "TENANT_SUSPENDED") return "suspended";
  return null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export interface ApiResult<T> {
  ok: boolean;
  status: number; // 0 = network failure
  data: T | null;
  meta?: ApiMeta;
  /** Backend error code (e.g. TENANT_NOT_FOUND) when the request failed. */
  code?: string;
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query) {
  const url = new URL(API_URL + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/** Never throws. Network errors resolve with `status: 0`. */
export async function storeFetch<T>(
  ctx: RequestContext,
  path: string,
  { query, tags = [], revalidate = REVALIDATE }: { query?: Query; tags?: string[]; revalidate?: number } = {},
): Promise<ApiResult<T>> {
  const hdrs: Record<string, string> = { Accept: "application/json" };
  if (ctx.host) hdrs["X-Store-Domain"] = ctx.host;
  const t = ctx.host || "unknown";
  // Global tags (e.g. "products") plus tenant-scoped ones ("demo:products", "tenant:demo").
  const allTags = [...tags, ...tags.map((tag) => `${t}:${tag}`), `tenant:${t}`].slice(0, 64);
  try {
    const res = await fetch(buildUrl(path, query), { headers: hdrs, next: { revalidate, tags: allTags } });
    let body: Envelope<T> | null = null;
    try {
      body = (await res.json()) as Envelope<T>;
    } catch {
      body = null;
    }
    if (!res.ok || !body || body.success === false) {
      return { ok: false, status: res.status, data: null, code: body?.error?.code };
    }
    return { ok: true, status: res.status, data: (body.data ?? null) as T | null, meta: body.meta };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

const emptyMeta = (limit = 20): ApiMeta => ({ page: 1, limit, total: 0, total_pages: 0 });

export interface Paginated<T> {
  items: T[];
  meta: ApiMeta;
}

export interface ProductQuery {
  category?: string;
  brand?: string;
  min_price?: number | string;
  max_price?: number | string;
  featured?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((n) => [n, ...flattenCategories(n.children ?? [])]);
}

/** For generateStaticParams: never throws, returns [] when the API is unreachable. */
export async function safeStaticParams<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

/**
 * Server-side Store API bound to one tenant context.
 * Usage: `const api = storeApi(domain)` where `domain` is the [domain] route param.
 * List calls resolve to empty data and settings to DEFAULT_SETTINGS when the API is down;
 * detail calls return null on 404 and throw ApiError otherwise (ISR then keeps the stale page).
 */
export function storeApi(domainOrCtx: string | RequestContext) {
  const ctx = typeof domainOrCtx === "string" ? contextFor(domainOrCtx) : domainOrCtx;
  const get = <T>(path: string, opts?: { query?: Query; tags?: string[]; revalidate?: number }) => storeFetch<T>(ctx, path, opts);

  /** Settings plus whether this host maps to a store at all (for robots/sitemap/manifest). */
  async function getSettingsResult(): Promise<{ settings: StoreSettings; unavailable: StoreUnavailableReason | null }> {
    if (!ctx.host) return { settings: DEFAULT_SETTINGS, unavailable: "not_found" };
    const res = await get<Partial<StoreSettings>>("/store/settings", { tags: ["settings"] });
    if (!res.ok || !res.data) return { settings: DEFAULT_SETTINGS, unavailable: unavailableReason(res.code) };
    return { settings: mergeDefaults(DEFAULT_SETTINGS, res.data), unavailable: null };
  }

  return {
    ctx,

    async getSettings(): Promise<StoreSettings> {
      return (await getSettingsResult()).settings;
    },

    getSettingsResult,

    async getProducts(q: ProductQuery = {}): Promise<Paginated<Product>> {
      const res = await get<Product[]>("/store/products", {
        query: { ...q, featured: q.featured ? "true" : undefined } as Query,
        tags: ["products"],
      });
      const items = Array.isArray(res.data) ? res.data : [];
      return { items, meta: res.meta ?? { ...emptyMeta(q.limit), total: items.length, total_pages: items.length ? 1 : 0 } };
    },

    async getProduct(slug: string): Promise<ProductDetail | null> {
      const res = await get<ProductDetail>(`/store/products/${encodeURIComponent(slug)}`, { tags: ["products", `product:${slug}`] });
      if (res.ok && res.data) return { ...res.data, related: res.data.related ?? [] };
      if (res.status === 404) return null;
      throw new ApiError(res.status, "Unable to load product");
    },

    async getProductReviews(slug: string, page = 1, limit = 10): Promise<Paginated<Review>> {
      const res = await get<Review[]>(`/store/products/${encodeURIComponent(slug)}/reviews`, {
        query: { page, limit },
        tags: ["reviews", `reviews:${slug}`],
      });
      const items = Array.isArray(res.data) ? res.data : [];
      return { items, meta: res.meta ?? emptyMeta(limit) };
    },

    async getCategories(): Promise<CategoryNode[]> {
      const res = await get<CategoryNode[]>("/store/categories", { tags: ["categories"] });
      return Array.isArray(res.data) ? res.data : [];
    },

    async getCategory(slug: string): Promise<CategoryDetail | null> {
      const res = await get<CategoryDetail>(`/store/categories/${encodeURIComponent(slug)}`, { tags: ["categories", `category:${slug}`] });
      if (res.ok && res.data) return { ...res.data, breadcrumbs: res.data.breadcrumbs ?? [] };
      if (res.status === 404) return null;
      throw new ApiError(res.status, "Unable to load category");
    },

    async getBrands(): Promise<Brand[]> {
      const res = await get<Brand[]>("/store/brands", { query: { limit: 100 }, tags: ["brands"] });
      return Array.isArray(res.data) ? res.data : [];
    },

    async getBrand(slug: string): Promise<Brand | null> {
      const res = await get<Brand>(`/store/brands/${encodeURIComponent(slug)}`, { tags: ["brands", `brand:${slug}`] });
      if (res.ok && res.data) return res.data;
      if (res.status === 404) return null;
      throw new ApiError(res.status, "Unable to load brand");
    },

    async getPages(): Promise<PageSummary[]> {
      const res = await get<PageSummary[]>("/store/pages", { tags: ["pages"] });
      return Array.isArray(res.data) ? res.data : [];
    },

    async getPage(slug: string): Promise<CmsPage | null> {
      const res = await get<CmsPage>(`/store/pages/${encodeURIComponent(slug)}`, { tags: ["pages", `page:${slug}`] });
      if (res.ok && res.data) return res.data;
      if (res.status === 404) return null;
      throw new ApiError(res.status, "Unable to load page");
    },

    async search(q: string, limit = 24): Promise<SearchResults> {
      if (!q.trim()) return { products: [], categories: [], brands: [] };
      const res = await get<SearchResults>("/store/search", { query: { q, limit }, tags: ["search"] });
      return {
        products: res.data?.products ?? [],
        categories: res.data?.categories ?? [],
        brands: res.data?.brands ?? [],
      };
    },

    async getSitemap(): Promise<SitemapData> {
      const res = await get<SitemapData>("/store/sitemap", { tags: ["sitemap", "products", "categories"] });
      return {
        products: res.data?.products ?? [],
        categories: res.data?.categories ?? [],
        brands: res.data?.brands ?? [],
        pages: res.data?.pages ?? [],
      };
    },
  };
}

export type StoreApi = ReturnType<typeof storeApi>;

/** Public platform details (shown on hosts that don't belong to any store). Never throws. */
export async function getPlatform(): Promise<PlatformInfo | null> {
  try {
    const res = await fetch(buildUrl("/store/platform"), { headers: { Accept: "application/json" }, next: { revalidate: REVALIDATE, tags: ["platform"] } });
    const body = (await res.json()) as Envelope<PlatformInfo>;
    return res.ok && body.success && body.data ? body.data : null;
  } catch {
    return null;
  }
}
