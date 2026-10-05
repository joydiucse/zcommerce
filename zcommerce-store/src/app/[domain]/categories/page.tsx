import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/Section";
import { storeApi } from "@/lib/api";
import { imageProps } from "@/lib/images";
import { buildMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { breadcrumbLd } from "@/lib/structured-data";

export const revalidate = 60;

type Props = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const api = storeApi((await params).domain);
  const settings = await api.getSettings();
  return buildMetadata(
    api,
    { title: "Categories", description: `Shop all categories at ${settings.general.store_name}.`, path: "/categories" },
    settings,
  );
}

export default async function CategoriesPage({ params }: Props) {
  const api = storeApi((await params).domain);
  const [categories, settings] = await Promise.all([api.getCategories(), api.getSettings()]);
  const siteUrl = getSiteUrl(settings, api.ctx);
  return (
    <>
      <PageHeader title="Shop by category" description="Find exactly what you are looking for.">
        <Breadcrumbs items={[{ name: "Categories", path: "/categories" }]} />
      </PageHeader>
      <div className="container-store py-10">
        {categories.length === 0 ? (
          <p className="py-16 text-center text-slate-500">No categories yet.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id} className="card overflow-hidden">
                <Link href={`/categories/${c.slug}`} className="group block">
                  <span className="relative block aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/15 to-accent/15">
                    {c.image_url ? (
                      <Image
                        {...imageProps(c.image_url)}
                        alt={c.name}
                        fill
                        sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-6xl font-black text-primary/30" aria-hidden>
                        {c.name.charAt(0)}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center justify-between p-5 pb-3">
                    <span className="text-lg font-semibold text-slate-900 group-hover:text-primary">{c.name}</span>
                    <span className="text-sm text-slate-500">{c.product_count ?? 0} products</span>
                  </span>
                </Link>
                {c.children?.length > 0 && (
                  <ul className="flex flex-wrap gap-2 px-5 pb-5">
                    {c.children.map((ch) => (
                      <li key={ch.id}>
                        <Link
                          href={`/categories/${ch.slug}`}
                          className="inline-block rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-primary/10 hover:text-primary"
                        >
                          {ch.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <JsonLd
        data={breadcrumbLd(siteUrl, [
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
        ])}
      />
    </>
  );
}
