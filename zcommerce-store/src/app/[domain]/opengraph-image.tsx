import { storeApi } from "@/lib/api";
import { OG_SIZE, inlineImage, ogImage } from "@/lib/og";

export const alt = "Store preview";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

/** Default OG image: uses seo.og_image_url as artwork when set, otherwise a branded card in the theme colours. */
export default async function Image({ params }: { params: Promise<{ domain: string }> }) {
  const settings = await storeApi((await params).domain).getSettings();
  const art = await inlineImage(settings.seo.og_image_url);
  return ogImage({
    settings,
    title: settings.seo.meta_title || settings.general.store_name,
    subtitle: settings.general.tagline || settings.seo.meta_description || undefined,
    image: art,
  });
}
