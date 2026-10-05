import type { MetadataRoute } from "next";
import { contextFromHeaders, storeApi } from "@/lib/api";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const api = storeApi(await contextFromHeaders());
  const { settings, unavailable } = await api.getSettingsResult();
  const base = getSiteUrl(settings, api.ctx);
  if (unavailable || !settings.seo.robots_index) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cart", "/checkout", "/account", "/search?", "/api/"],
      },
    ],
    sitemap: absoluteUrl(base, "/sitemap.xml"),
  };
}
