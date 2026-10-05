import type { Metadata } from "next";
import { BrandStrip } from "@/components/home/BrandStrip";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/Section";
import { storeApi } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { breadcrumbLd } from "@/lib/structured-data";

export const revalidate = 60;

type Props = { params: Promise<{ domain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const api = storeApi((await params).domain);
  const settings = await api.getSettings();
  return buildMetadata(api, { title: "Brands", description: `Shop by brand at ${settings.general.store_name}.`, path: "/brands" }, settings);
}

export default async function BrandsPage({ params }: Props) {
  const api = storeApi((await params).domain);
  const [brands, settings] = await Promise.all([api.getBrands(), api.getSettings()]);
  const siteUrl = getSiteUrl(settings, api.ctx);
  return (
    <>
      <PageHeader title="Brands" description="The makers we love and stock.">
        <Breadcrumbs items={[{ name: "Brands", path: "/brands" }]} />
      </PageHeader>
      <div className="container-store py-10">
        {brands.length ? <BrandStrip brands={brands} /> : <p className="py-16 text-center text-slate-500">No brands yet.</p>}
      </div>
      <JsonLd
        data={breadcrumbLd(siteUrl, [
          { name: "Home", path: "/" },
          { name: "Brands", path: "/brands" },
        ])}
      />
    </>
  );
}
