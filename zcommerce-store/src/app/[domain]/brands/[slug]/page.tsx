import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/product/ListingSkeleton";
import { ProductListing } from "@/components/product/ProductListing";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { storeApi } from "@/lib/api";
import { stripHtml, truncate } from "@/lib/format";
import { imageProps } from "@/lib/images";
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
  const [brand, settings] = await Promise.all([api.getBrand(slug).catch(() => null), api.getSettings()]);
  if (!brand) return buildMetadata(api, { title: "Brand not found", path: `/brands/${slug}`, noindex: true }, settings);
  const base = brand.meta_title || brand.name;
  return buildMetadata(
    api,
    {
      title: lp.page > 1 ? `${base} – Page ${lp.page}` : base,
      description: truncate(stripHtml(brand.meta_description || brand.description) || `Shop ${brand.name} products at ${settings.general.store_name}.`),
      path: listingHref(`/brands/${brand.slug}`, { ...lp, brand: undefined }),
      images: brand.logo_url ? [{ url: brand.logo_url, alt: brand.name }] : undefined,
      noindex: !!(lp.category || lp.min_price || lp.max_price || lp.sort !== "newest"),
    },
    settings,
  );
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { domain, slug } = await params;
  const api = storeApi(domain);
  const brand = await api.getBrand(slug);
  if (!brand) notFound();
  const lp = parseListingParams(await searchParams);
  const settings = await api.getSettings();
  const siteUrl = getSiteUrl(settings, api.ctx);
  const crumbs: Crumb[] = [
    { name: "Brands", path: "/brands" },
    { name: brand.name, path: `/brands/${brand.slug}` },
  ];
  return (
    <>
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="container-store py-8 sm:py-10">
          <Breadcrumbs items={crumbs} />
          <div className="mt-4 flex items-center gap-5">
            {brand.logo_url && (
              <span className="relative size-20 shrink-0 overflow-hidden rounded-card border border-slate-200 bg-white p-2">
                <Image {...imageProps(brand.logo_url)} alt={`${brand.name} logo`} fill sizes="80px" className="object-contain p-2" />
              </span>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{brand.name}</h1>
              {brand.description && <p className="mt-2 max-w-3xl text-slate-600">{stripHtml(brand.description)}</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="container-store py-8">
        <Suspense key={JSON.stringify(lp)} fallback={<ListingSkeleton />}>
          <ProductListing api={api} basePath={`/brands/${brand.slug}`} params={lp} lock={{ type: "brand", slug: brand.slug }} title={brand.name} />
        </Suspense>
      </div>
      <JsonLd data={breadcrumbLd(siteUrl, [{ name: "Home", path: "/" }, ...crumbs])} />
    </>
  );
}
