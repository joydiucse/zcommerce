import type { Metadata } from "next";
import Link from "next/link";
import { BrandStrip } from "@/components/home/BrandStrip";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { HeroSlider } from "@/components/home/HeroSlider";
import { Newsletter } from "@/components/home/Newsletter";
import { ProductGrid } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { Section } from "@/components/ui/Section";
import { flattenCategories, storeApi } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { itemListLd } from "@/lib/structured-data";

export const revalidate = 60;

type Props = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const api = storeApi((await params).domain);
  return buildMetadata(api, { path: "/" });
}

export default async function HomePage({ params }: Props) {
  const api = storeApi((await params).domain);
  const settings = await api.getSettings();
  const { homepage, general } = settings;
  const { sections } = homepage;
  const perSection = Math.min(Math.max(Number(homepage.products_per_section) || 8, 1), 24);

  const [featured, newest, categories, brands] = await Promise.all([
    sections.featured_products ? api.getProducts({ featured: true, limit: perSection }) : null,
    sections.new_arrivals ? api.getProducts({ sort: "newest", limit: perSection }) : null,
    sections.categories ? api.getCategories() : Promise.resolve([]),
    sections.brands ? api.getBrands() : Promise.resolve([]),
  ]);

  let featuredCategories = categories;
  if (homepage.featured_category_ids?.length) {
    const all = flattenCategories(categories);
    const picked = homepage.featured_category_ids
      .map((id) => all.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c);
    if (picked.length) featuredCategories = picked;
  }
  featuredCategories = featuredCategories.slice(0, 6);
  const siteUrl = getSiteUrl(settings, api.ctx);
  const slides = (homepage.hero_slides ?? []).filter((s) => s.image_url || s.title);

  return (
    <>
      <h1 className="sr-only">
        {general.store_name}
        {general.tagline ? ` — ${general.tagline}` : ""}
      </h1>

      {slides.length > 0 ? (
        <HeroSlider slides={slides} storeName={general.store_name} />
      ) : (
        <section className="bg-gradient-to-br from-secondary to-primary text-white">
          <div className="container-store py-20 sm:py-28">
            <p className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">{general.tagline || `Welcome to ${general.store_name}`}</p>
            <p className="mt-4 max-w-xl text-lg text-white/80">Discover our latest collection, curated for you.</p>
            <Link href="/products" className="btn btn-lg mt-8 bg-white text-slate-900 hover:bg-white/90">
              Shop now
            </Link>
          </div>
        </section>
      )}

      <div className="space-y-16 py-14 sm:space-y-20">
        {sections.categories && featuredCategories.length > 0 && (
          <Section title="Shop by category" href="/categories" linkLabel="All categories">
            <CategoryTiles categories={featuredCategories} />
          </Section>
        )}

        {featured && featured.items.length > 0 && (
          <Section title="Featured products" subtitle="Hand-picked favourites" href="/products?sort=popular">
            <ProductGrid products={featured.items} />
            <JsonLd data={itemListLd(siteUrl, "Featured products", featured.items)} />
          </Section>
        )}

        {newest && newest.items.length > 0 && (
          <Section title="New arrivals" subtitle="Fresh in store" href="/products">
            <ProductGrid products={newest.items} />
          </Section>
        )}

        {sections.brands && brands.length > 0 && (
          <Section title="Our brands" href="/brands" linkLabel="All brands">
            <BrandStrip brands={brands.slice(0, 12)} />
          </Section>
        )}

        {!featured?.items.length && !newest?.items.length && (
          <section className="container-store text-center text-slate-500">
            <p>Products will appear here soon.</p>
            <Link href="/products" className="btn btn-outline mt-4">
              Browse the catalogue
            </Link>
          </section>
        )}

        {sections.newsletter && <Newsletter storeName={general.store_name} />}
      </div>
    </>
  );
}
