import type { Metadata } from "next";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import { BrandStrip } from "@/components/home/BrandStrip";
import { ProductGrid } from "@/components/product/ProductCard";
import { storeApi } from "@/lib/api";
import type { RawSearchParams } from "@/lib/listing";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 0;

type Props = { params: Promise<{ domain: string }>; searchParams: Promise<RawSearchParams> };

const getQ = (sp: RawSearchParams) => (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 100) ?? "";

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const api = storeApi((await params).domain);
  const q = getQ(await searchParams);
  const settings = await api.getSettings();
  return buildMetadata(api, { title: q ? `Search results for “${q}”` : "Search", path: "/search", noindex: true }, settings);
}

export default async function SearchPage({ params, searchParams }: Props) {
  const api = storeApi((await params).domain);
  const q = getQ(await searchParams);
  const results = await api.search(q, 24);
  const total = results.products.length + results.categories.length + results.brands.length;
  return (
    <div className="container-store py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{q ? <>Results for “{q}”</> : "Search"}</h1>
      <form action="/search" role="search" className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="search-page-q" className="sr-only">
          Search
        </label>
        <input id="search-page-q" name="q" type="search" defaultValue={q} placeholder="Search products, categories, brands…" className="input h-12" />
        <button type="submit" className="btn btn-primary h-12" aria-label="Search">
          <FiSearch className="size-5" aria-hidden />
        </button>
      </form>

      {!q ? (
        <p className="mt-10 text-slate-500">Type something to start searching.</p>
      ) : total === 0 ? (
        <div className="mt-12 rounded-card border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="font-medium text-slate-800">No results for “{q}”</p>
          <p className="mt-1 text-sm text-slate-500">Check the spelling or try a more general term.</p>
          <Link href="/products" className="btn btn-primary mt-5">
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {results.categories.length > 0 && (
            <section aria-labelledby="sr-cats">
              <h2 id="sr-cats" className="mb-4 text-lg font-semibold text-slate-900">
                Categories
              </h2>
              <ul className="flex flex-wrap gap-2">
                {results.categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/categories/${c.slug}`} className="inline-block rounded-full border border-slate-200 px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.brands.length > 0 && (
            <section aria-labelledby="sr-brands">
              <h2 id="sr-brands" className="mb-4 text-lg font-semibold text-slate-900">
                Brands
              </h2>
              <BrandStrip brands={results.brands} />
            </section>
          )}
          {results.products.length > 0 && (
            <section aria-labelledby="sr-products">
              <h2 id="sr-products" className="mb-4 text-lg font-semibold text-slate-900">
                Products ({results.products.length})
              </h2>
              <ProductGrid products={results.products} />
              <p className="mt-6 text-center">
                <Link href="/products" className="text-sm font-medium text-primary hover:underline">
                  Need more? Browse the full catalogue
                </Link>
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
