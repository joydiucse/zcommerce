import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/product/ListingSkeleton";
import { ProductListing } from "@/components/product/ProductListing";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/Section";
import { flattenCategories, storeApi } from "@/lib/api";
import { stripHtml, truncate } from "@/lib/format";
import { listingHref, parseListingParams, type RawSearchParams } from "@/lib/listing";
import { buildMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { breadcrumbLd } from "@/lib/structured-data";

// Filters, sort and pagination live in the URL (searchParams), so this route renders per request;
// the API calls themselves stay cached (fetch revalidate + tags). revalidate = 0 keeps those caches.
export const revalidate = 0;

type Props = { params: Promise<{ domain: string; slug: string }>; searchParams: Promise<RawSearchParams> };

/** Hosts are only known at request time: render on first visit, then serve from the ISR cache. */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { domain, slug } = await params;
  const api = storeApi(domain);
  const lp = parseListingParams(await searchParams);
  const [category, settings] = await Promise.all([api.getCategory(slug).catch(() => null), api.getSettings()]);
  if (!category) return buildMetadata(api, { title: "Category not found", path: `/categories/${slug}`, noindex: true }, settings);
  const base = category.meta_title || category.name;
  return buildMetadata(
    api,
    {
      title: lp.page > 1 ? `${base} – Page ${lp.page}` : base,
      description: truncate(stripHtml(category.meta_description || category.description) || `Shop ${category.name} at ${settings.general.store_name}.`),
      path: listingHref(`/categories/${category.slug}`, { ...lp, category: undefined, brand: lp.brand }),
      images: category.image_url ? [{ url: category.image_url, alt: category.name }] : undefined,
      noindex: !!(lp.brand || lp.min_price || lp.max_price || lp.sort !== "newest"),
    },
    settings,
  );
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { domain, slug } = await params;
  const api = storeApi(domain);
  const category = await api.getCategory(slug);
  if (!category) notFound();
  const lp = parseListingParams(await searchParams);
  const settings = await api.getSettings();
  const siteUrl = getSiteUrl(settings, api.ctx);

  let children = category.children ?? [];
  if (!children.length) {
    const node = flattenCategories(await api.getCategories()).find((c) => c.slug === category.slug);
    children = node?.children ?? [];
  }

  const trail = (category.breadcrumbs ?? []).filter((b) => b.slug !== category.slug);
  const crumbs: Crumb[] = [
    { name: "Categories", path: "/categories" },
    ...trail.map((b) => ({ name: b.name, path: `/categories/${b.slug}` })),
    { name: category.name, path: `/categories/${category.slug}` },
  ];

  return (
    <>
      <PageHeader title={category.name} description={stripHtml(category.description) || undefined}>
        <Breadcrumbs items={crumbs} />
      </PageHeader>
      <div className="container-store py-8">
        {children.length > 0 && (
          <nav aria-label="Subcategories" className="mb-8">
            <ul className="flex flex-wrap gap-2">
              {children.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/categories/${c.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary"
                  >
                    {c.name}
                    {typeof c.product_count === "number" && <span className="text-xs text-slate-400">{c.product_count}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <Suspense key={JSON.stringify(lp)} fallback={<ListingSkeleton />}>
          <ProductListing
            api={api}
          basePath={`/categories/${category.slug}`}
          params={lp}
          lock={{ type: "category", slug: category.slug }}
          title={category.name}
        />
        </Suspense>
      </div>
      <JsonLd data={breadcrumbLd(siteUrl, [{ name: "Home", path: "/" }, ...crumbs])} />
    </>
  );
}
