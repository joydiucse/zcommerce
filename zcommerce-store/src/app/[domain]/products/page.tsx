import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingSkeleton } from "@/components/product/ListingSkeleton";
import { ProductListing } from "@/components/product/ProductListing";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/Section";
import { storeApi } from "@/lib/api";
import { listingHref, parseListingParams, type RawSearchParams } from "@/lib/listing";
import { buildMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { breadcrumbLd } from "@/lib/structured-data";

// Filters, sort and pagination live in the URL (searchParams), so this route renders per request;
// the API calls themselves stay cached (fetch revalidate + tags). revalidate = 0 keeps those caches.
export const revalidate = 0;

type Props = { params: Promise<{ domain: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params: routeParams, searchParams }: Props): Promise<Metadata> {
  const api = storeApi((await routeParams).domain);
  const params = parseListingParams(await searchParams);
  const settings = await api.getSettings();
  const filtered = !!(params.category || params.brand || params.min_price || params.max_price || params.sort !== "newest");
  return buildMetadata(
    api,
    {
      title: params.page > 1 ? `All products – Page ${params.page}` : "All products",
      description: `Browse all products at ${settings.general.store_name}.`,
      path: listingHref("/products", params),
      // Faceted variations are crawlable but kept out of the index to avoid duplicate content.
      noindex: filtered,
    },
    settings,
  );
}

export default async function ProductsPage({ params: routeParams, searchParams }: Props) {
  const api = storeApi((await routeParams).domain);
  const params = parseListingParams(await searchParams);
  const settings = await api.getSettings();
  const siteUrl = getSiteUrl(settings, api.ctx);
  return (
    <>
      <PageHeader title="All products" description={`Explore the full ${settings.general.store_name} collection.`}>
        <Breadcrumbs items={[{ name: "Products", path: "/products" }]} />
      </PageHeader>
      <div className="container-store py-8">
        <Suspense key={JSON.stringify(params)} fallback={<ListingSkeleton />}>
          <ProductListing api={api} basePath="/products" params={params} title="All products" />
        </Suspense>
      </div>
      <JsonLd
        data={breadcrumbLd(siteUrl, [
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
        ])}
      />
    </>
  );
}
