import type { MetadataRoute } from "next";
import { contextFromHeaders, storeApi } from "@/lib/api";
import { safeColor } from "@/lib/site";

export const revalidate = 3600;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await storeApi(await contextFromHeaders()).getSettings();
  const { general, theme, seo } = settings;
  const icons: MetadataRoute.Manifest["icons"] = general.favicon_url
    ? [{ src: general.favicon_url, sizes: "any" }]
    : [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }];
  return {
    name: general.store_name,
    short_name: general.store_name.slice(0, 12),
    description: seo.meta_description || general.tagline || general.store_name,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: safeColor(theme.primary_color, "#4f46e5"),
    lang: general.locale,
    icons,
  };
}
