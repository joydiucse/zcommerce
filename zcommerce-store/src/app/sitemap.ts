import type { MetadataRoute } from "next";
import { contextFromHeaders, storeApi } from "@/lib/api";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

const date = (s?: string) => {
  const d = s ? new Date(s) : null;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const api = storeApi(await contextFromHeaders());
  const { settings, unavailable } = await api.getSettingsResult();
  if (unavailable) return [];
  const data = await api.getSitemap();
  const base = getSiteUrl(settings, api.ctx);
  const now = new Date();
  const latest = (list: { updated_at: string }[]) =>
    list.reduce<Date | undefined>((acc, e) => {
      const d = date(e.updated_at);
      return d && (!acc || d > acc) ? d : acc;
    }, undefined) ?? now;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl(base, "/"), lastModified: latest(data.products), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl(base, "/products"), lastModified: latest(data.products), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl(base, "/categories"), lastModified: latest(data.categories), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl(base, "/brands"), lastModified: latest(data.brands), changeFrequency: "weekly", priority: 0.6 },
  ];

  return [
    ...staticRoutes,
    ...data.products.map((p) => ({
      url: absoluteUrl(base, `/products/${p.slug}`),
      lastModified: date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...data.categories.map((c) => ({
      url: absoluteUrl(base, `/categories/${c.slug}`),
      lastModified: date(c.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...data.brands.map((b) => ({
      url: absoluteUrl(base, `/brands/${b.slug}`),
      lastModified: date(b.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...data.pages.map((p) => ({
      url: absoluteUrl(base, `/pages/${p.slug}`),
      lastModified: date(p.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
