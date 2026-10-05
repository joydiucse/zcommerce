import Link from "next/link";
import { FiSliders, FiX } from "react-icons/fi";
import { JsonLd } from "@/components/seo/JsonLd";
import { Pagination } from "@/components/ui/Pagination";
import { flattenCategories, type StoreApi } from "@/lib/api";
import { getSiteUrl } from "@/lib/site";
import { listingHref, type ListingParams } from "@/lib/listing";
import { itemListLd } from "@/lib/structured-data";
import type { Brand, CategoryNode } from "@/lib/types";
import { PriceFilter, SortSelect } from "./ListingControls";
import { ProductGrid } from "./ProductCard";

const PER_PAGE = 12;

function CategoryLinks({
  nodes,
  params,
  basePath,
  depth = 0,
}: {
  nodes: CategoryNode[];
  params: ListingParams;
  basePath: string;
  depth?: number;
}) {
  return (
    <ul className={depth ? "mt-1 ml-3 space-y-1 border-l border-slate-100 pl-3" : "space-y-1"}>
      {nodes.map((c) => {
        const active = params.category === c.slug;
        return (
          <li key={c.id}>
            <Link
              href={listingHref(basePath, { ...params, category: active ? undefined : c.slug, page: 1 })}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                active ? "bg-primary/10 font-semibold text-primary" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              aria-current={active ? "true" : undefined}
              rel="nofollow"
            >
              <span>{c.name}</span>
              {typeof c.product_count === "number" && <span className="text-xs text-slate-400">{c.product_count}</span>}
            </Link>
            {c.children?.length > 0 && <CategoryLinks nodes={c.children} params={params} basePath={basePath} depth={depth + 1} />}
          </li>
        );
      })}
    </ul>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 pb-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Filters({
  params,
  basePath,
  categories,
  brands,
  lock,
}: {
  params: ListingParams;
  basePath: string;
  categories: CategoryNode[];
  brands: Brand[];
  lock?: "category" | "brand";
}) {
  return (
    <div className="space-y-5">
      {lock !== "category" && categories.length > 0 && (
        <FilterGroup title="Categories">
          <CategoryLinks nodes={categories} params={params} basePath={basePath} />
        </FilterGroup>
      )}
      {lock !== "brand" && brands.length > 0 && (
        <FilterGroup title="Brands">
          <ul className="space-y-1">
            {brands.map((b) => {
              const active = params.brand === b.slug;
              return (
                <li key={b.id}>
                  <Link
                    href={listingHref(basePath, { ...params, brand: active ? undefined : b.slug, page: 1 })}
                    rel="nofollow"
                    className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm ${
                      active ? "font-semibold text-primary" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    aria-current={active ? "true" : undefined}
                  >
                    <span
                      className={`grid size-4 place-items-center rounded border ${active ? "border-primary bg-primary text-primary-fg" : "border-slate-300"}`}
                      aria-hidden
                    >
                      {active && "✓"}
                    </span>
                    {b.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </FilterGroup>
      )}
      <FilterGroup title="Price">
        <PriceFilter key={`${params.min_price}-${params.max_price}`} basePath={basePath} params={params} />
      </FilterGroup>
    </div>
  );
}

export async function ProductListing({
  api,
  basePath,
  params,
  lock,
  title,
  search,
}: {
  api: StoreApi;
  basePath: string;
  params: ListingParams;
  /** Category/brand pages lock their own filter. */
  lock?: { type: "category" | "brand"; slug: string };
  title: string;
  search?: string;
}) {
  const query = {
    ...params,
    category: lock?.type === "category" ? lock.slug : params.category,
    brand: lock?.type === "brand" ? lock.slug : params.brand,
  };
  const [{ items, meta }, categories, brands] = await Promise.all([
    api.getProducts({ ...query, limit: PER_PAGE, search }),
    lock?.type === "category" ? Promise.resolve([]) : api.getCategories(),
    lock?.type === "brand" ? Promise.resolve([]) : api.getBrands(),
  ]);
  const siteUrl = getSiteUrl(await api.getSettings(), api.ctx);
  const activeChips: { label: string; href: string }[] = [];
  if (params.category && lock?.type !== "category") {
    const name = flattenCategories(categories).find((c) => c.slug === params.category)?.name;
    activeChips.push({ label: name ?? params.category, href: listingHref(basePath, { ...params, category: undefined, page: 1 }) });
  }
  if (params.brand && lock?.type !== "brand") {
    const name = brands.find((b) => b.slug === params.brand)?.name;
    activeChips.push({ label: name ?? params.brand, href: listingHref(basePath, { ...params, brand: undefined, page: 1 }) });
  }
  if (params.min_price || params.max_price) {
    activeChips.push({
      label: `Price ${params.min_price ?? "0"} – ${params.max_price ?? "∞"}`,
      href: listingHref(basePath, { ...params, min_price: undefined, max_price: undefined, page: 1 }),
    });
  }

  const filters = (
    <Filters params={params} basePath={basePath} categories={categories} brands={brands} lock={lock?.type} />
  );

  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
      <aside className="hidden lg:block" aria-label="Product filters">
        {filters}
      </aside>
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500" aria-live="polite">
            {meta.total} {meta.total === 1 ? "product" : "products"}
          </p>
          <div className="flex items-center gap-2">
            <details className="relative lg:hidden">
              <summary className="btn btn-outline h-10 cursor-pointer list-none py-0 [&::-webkit-details-marker]:hidden">
                <FiSliders className="size-4" aria-hidden /> Filters
              </summary>
              <div className="absolute left-0 z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-card border border-slate-200 bg-white p-5 shadow-xl sm:right-0 sm:left-auto">
                {filters}
              </div>
            </details>
            <SortSelect basePath={basePath} params={params} />
          </div>
        </div>
        {activeChips.length > 0 && (
          <ul className="mb-5 flex flex-wrap gap-2" aria-label="Active filters">
            {activeChips.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">
                  {c.label} <FiX className="size-3.5" aria-label="Remove filter" />
                </Link>
              </li>
            ))}
            <li>
              <Link href={basePath} className="inline-flex px-2 py-1 text-sm font-medium text-primary hover:underline">
                Clear all
              </Link>
            </li>
          </ul>
        )}
        {items.length ? (
          <ProductGrid products={items} priorityCount={4} cols={3} />
        ) : (
          <div className="rounded-card border border-dashed border-slate-300 px-6 py-16 text-center">
            <p className="font-medium text-slate-800">No products found</p>
            <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or check back soon.</p>
            {activeChips.length > 0 && (
              <Link href={basePath} className="btn btn-primary mt-5">
                Clear filters
              </Link>
            )}
          </div>
        )}
        <Pagination page={meta.page || params.page} totalPages={meta.total_pages} hrefFor={(p) => listingHref(basePath, { ...params, page: p })} />
        {items.length > 0 && <JsonLd data={itemListLd(siteUrl, title, items, (params.page - 1) * PER_PAGE)} />}
      </div>
    </div>
  );
}
