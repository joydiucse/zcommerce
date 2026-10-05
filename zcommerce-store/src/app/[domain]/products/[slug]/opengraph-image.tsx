import { storeApi } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { OG_SIZE, inlineImage, ogImage } from "@/lib/og";

export const alt = "Product image";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ domain: string; slug: string }> }) {
  const { domain, slug } = await params;
  const api = storeApi(domain);
  const [settings, product] = await Promise.all([api.getSettings(), api.getProduct(slug).catch(() => null)]);
  if (!product) return ogImage({ settings, title: settings.general.store_name, subtitle: settings.general.tagline });
  const image = await inlineImage(product.images?.[0]?.url);
  return ogImage({
    settings,
    title: product.name,
    subtitle: product.brand?.name ?? product.category?.name ?? undefined,
    image,
    badge: formatMoney(product.price, { currency: settings.general.currency, locale: settings.general.locale }),
  });
}
