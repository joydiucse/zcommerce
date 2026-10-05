import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/Section";
import { storeApi } from "@/lib/api";
import { formatDate, sanitizeHtml, stripHtml, truncate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { breadcrumbLd } from "@/lib/structured-data";

export const revalidate = 300;

type Props = { params: Promise<{ domain: string; slug: string }> };

/** Hosts are only known at request time: render on first visit, then serve from the ISR cache. */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain, slug } = await params;
  const api = storeApi(domain);
  const [page, settings] = await Promise.all([api.getPage(slug).catch(() => null), api.getSettings()]);
  if (!page) return buildMetadata(api, { title: "Page not found", path: `/pages/${slug}`, noindex: true }, settings);
  return buildMetadata(
    api,
    {
      title: page.meta_title || page.title,
      description: truncate(stripHtml(page.meta_description || page.content)),
      path: `/pages/${page.slug}`,
      type: "article",
    },
    settings,
  );
}

export default async function CmsPage({ params }: Props) {
  const { domain, slug } = await params;
  const api = storeApi(domain);
  const page = await api.getPage(slug);
  if (!page) notFound();
  const settings = await api.getSettings();
  const siteUrl = getSiteUrl(settings, api.ctx);
  return (
    <>
      <PageHeader title={page.title}>
        <Breadcrumbs items={[{ name: page.title, path: `/pages/${page.slug}` }]} />
      </PageHeader>
      <article className="container-store py-10">
        <div className="prose-store mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }} />
        {page.updated_at && (
          <p className="mx-auto mt-10 max-w-3xl border-t border-slate-100 pt-4 text-sm text-slate-400">
            Last updated <time dateTime={page.updated_at}>{formatDate(page.updated_at, settings.general.locale)}</time>
          </p>
        )}
      </article>
      <JsonLd
        data={breadcrumbLd(siteUrl, [
          { name: "Home", path: "/" },
          { name: page.title, path: `/pages/${page.slug}` },
        ])}
      />
    </>
  );
}
