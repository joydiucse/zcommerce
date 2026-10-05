export const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
] as const;

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface ListingParams {
  page: number;
  sort: string;
  category?: string;
  brand?: string;
  min_price?: string;
  max_price?: string;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const num = (v: string | undefined) => (v && /^\d+(\.\d+)?$/.test(v) ? v : undefined);

export function parseListingParams(sp: RawSearchParams): ListingParams {
  const page = Math.max(1, parseInt(first(sp.page) || "1", 10) || 1);
  const sortRaw = first(sp.sort);
  const sort = SORTS.some((s) => s.value === sortRaw) ? (sortRaw as string) : "newest";
  return {
    page,
    sort,
    category: first(sp.category),
    brand: first(sp.brand),
    min_price: num(first(sp.min_price)),
    max_price: num(first(sp.max_price)),
  };
}

/** Serialises listing state into a URL. Default values are omitted for clean canonical URLs. */
export function listingHref(basePath: string, p: Partial<ListingParams>): string {
  const sp = new URLSearchParams();
  if (p.category) sp.set("category", p.category);
  if (p.brand) sp.set("brand", p.brand);
  if (p.min_price) sp.set("min_price", p.min_price);
  if (p.max_price) sp.set("max_price", p.max_price);
  if (p.sort && p.sort !== "newest") sp.set("sort", p.sort);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
