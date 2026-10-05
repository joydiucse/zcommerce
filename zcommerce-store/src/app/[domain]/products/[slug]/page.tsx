import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiCheckCircle, FiRefreshCw, FiShield, FiTruck, FiXCircle } from "react-icons/fi";
import { AddToCart } from "@/components/product/AddToCart";
import { Gallery } from "@/components/product/Gallery";
import { Price } from "@/components/product/Price";
import { ProductGrid } from "@/components/product/ProductCard";
import { ProductTabs } from "@/components/product/ProductTabs";
import { ReviewForm } from "@/components/product/ReviewForm";
import { ReviewList } from "@/components/product/ReviewList";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { Stars } from "@/components/ui/Stars";
import { storeApi } from "@/lib/api";
import { discountPercent, sanitizeHtml, stripHtml, truncate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { breadcrumbLd, productLd } from "@/lib/structured-data";

export const revalidate = 60;

type Props = { params: Promise<{ domain: string; slug: string }> };

/** Hosts are only known at request time: render on first visit, then serve from the ISR cache. */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain, slug } = await params;
  const api = storeApi(domain);
  const product = await api.getProduct(slug).catch(() => null);
  const settings = await api.getSettings();
  if (!product) return buildMetadata(api, { title: "Product not found", path: `/products/${slug}`, noindex: true }, settings);
  const description = truncate(stripHtml(product.meta_description || product.short_description || product.description), 160);
  const meta = await buildMetadata(
    api,
    {
      title: product.meta_title || product.name,
      description,
      path: `/products/${product.slug}`,
      keywords: product.tags?.length ? product.tags : undefined,
      // OG/Twitter images come from ./opengraph-image.tsx (renders the product photo on the theme colours).
      fileBasedImages: true,
    },
    settings,
  );
  return {
    ...meta,
    other: {
      "og:type": "product",
      "product:price:amount": Number(product.price).toFixed(2),
      "product:price:currency": settings.general.currency,
      "product:availability": product.in_stock ? "in stock" : "out of stock",
      ...(product.brand ? { "product:brand": product.brand.name } : {}),
    },
  };
}

function StockStatus({ inStock, qty }: { inStock: boolean; qty: number }) {
  if (!inStock)
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
        <FiXCircle className="size-4" aria-hidden /> Out of stock
      </p>
    );
  return (
    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
      <FiCheckCircle className="size-4" aria-hidden /> In stock
      {qty > 0 && qty <= 5 && <span className="text-amber-600">— only {qty} left</span>}
    </p>
  );
}

export default async function ProductPage({ params }: Props) {
  const { domain, slug } = await params;
  const api = storeApi(domain);
  const product = await api.getProduct(slug);
  if (!product) notFound();

  const [settings, reviews] = await Promise.all([api.getSettings(), api.getProductReviews(product.slug)]);
  const siteUrl = getSiteUrl(settings, api.ctx);
  const off = discountPercent(product.price, product.compare_at_price);

  const crumbs: Crumb[] = [{ name: "Products", path: "/products" }];
  if (product.category) crumbs.push({ name: product.category.name, path: `/categories/${product.category.slug}` });
  crumbs.push({ name: product.name, path: `/products/${product.slug}` });

  const tabs = [
    product.description && {
      id: "description",
      label: "Description",
      content: <div className="prose-store max-w-3xl" dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />,
    },
    product.attributes?.length > 0 && {
      id: "attributes",
      label: "Specifications",
      content: (
        <dl className="max-w-2xl divide-y divide-slate-100 overflow-hidden rounded-card border border-slate-200">
          {product.attributes.map((a, i) => (
            <div key={`${a.name}-${i}`} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm odd:bg-slate-50">
              <dt className="font-medium text-slate-600">{a.name}</dt>
              <dd className="col-span-2 text-slate-900">{a.value}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: "reviews",
      label: `Reviews (${product.rating_count || reviews.meta.total || 0})`,
      content: (
        <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
          <div>
            {product.rating_count > 0 && (
              <div className="mb-6 flex items-center gap-3">
                <span className="text-4xl font-bold text-slate-900">{Number(product.rating_avg).toFixed(1)}</span>
                <div>
                  <Stars rating={product.rating_avg} size="md" />
                  <p className="text-sm text-slate-500">Based on {product.rating_count} reviews</p>
                </div>
              </div>
            )}
            <ReviewList slug={product.slug} initial={reviews.items} totalPages={reviews.meta.total_pages} />
          </div>
          <ReviewForm slug={product.slug} />
        </div>
      ),
    },
  ].filter(Boolean) as { id: string; label: string; content: React.ReactNode }[];

  return (
    <>
      <div className="container-store py-6">
        <Breadcrumbs items={crumbs} />
      </div>
      <article className="container-store">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <Gallery
            images={product.images ?? []}
            name={product.name}
            badge={off > 0 ? <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">Sale -{off}%</span> : undefined}
          />
          <div className="lg:py-2">
            {product.brand && (
              <Link href={`/brands/${product.brand.slug}`} className="text-sm font-semibold tracking-wide text-primary uppercase hover:underline">
                {product.brand.name}
              </Link>
            )}
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{product.name}</h1>
            {product.rating_count > 0 && (
              <a href="#product-info" className="mt-3 inline-flex">
                <Stars rating={product.rating_avg} count={product.rating_count} />
              </a>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Price price={product.price} compareAt={product.compare_at_price} size="lg" />
              {off > 0 && <span className="rounded-full bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-600">Save {off}%</span>}
            </div>
            <div className="mt-3">
              <StockStatus inStock={product.in_stock} qty={product.stock_quantity} />
            </div>
            {product.short_description && <p className="mt-5 leading-relaxed text-slate-600">{stripHtml(product.short_description)}</p>}
            <div className="mt-8">
              <AddToCart productId={product.id} inStock={product.in_stock} maxQuantity={product.stock_quantity} />
            </div>
            <ul className="mt-8 grid gap-3 rounded-card border border-slate-200 p-5 text-sm text-slate-600 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <li className="flex items-center gap-2">
                <FiTruck className="size-5 text-primary" aria-hidden /> Fast delivery
              </li>
              <li className="flex items-center gap-2">
                <FiRefreshCw className="size-5 text-primary" aria-hidden /> Easy returns
              </li>
              <li className="flex items-center gap-2">
                <FiShield className="size-5 text-primary" aria-hidden /> Secure checkout
              </li>
            </ul>
            <dl className="mt-6 space-y-1 text-sm text-slate-500">
              {product.sku && (
                <div className="flex gap-2">
                  <dt>SKU:</dt>
                  <dd className="text-slate-700">{product.sku}</dd>
                </div>
              )}
              {product.category && (
                <div className="flex gap-2">
                  <dt>Category:</dt>
                  <dd>
                    <Link href={`/categories/${product.category.slug}`} className="text-slate-700 hover:text-primary">
                      {product.category.name}
                    </Link>
                  </dd>
                </div>
              )}
              {product.tags?.length > 0 && (
                <div className="flex gap-2">
                  <dt>Tags:</dt>
                  <dd className="text-slate-700">{product.tags.join(", ")}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <section id="product-info" aria-label="Product details" className="mt-14 scroll-mt-24">
          <ProductTabs tabs={tabs} />
        </section>
      </article>

      {product.related.length > 0 && (
        <section aria-labelledby="related-heading" className="container-store mt-12">
          <h2 id="related-heading" className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
            You may also like
          </h2>
          <ProductGrid products={product.related.slice(0, 4)} />
        </section>
      )}

      <JsonLd data={productLd(settings, siteUrl, product, reviews.items)} />
      <JsonLd data={breadcrumbLd(siteUrl, [{ name: "Home", path: "/" }, ...crumbs])} />
    </>
  );
}
