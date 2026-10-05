import type { Metadata, Viewport } from "next";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Analytics, GtmNoScript } from "@/components/layout/Analytics";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar, Header } from "@/components/layout/Header";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { storeApi } from "@/lib/api";
import { fontVar } from "@/lib/fonts";
import { rootMetadata } from "@/lib/seo";
import { RADIUS, getSiteUrl, readableOn, safeColor } from "@/lib/site";
import { organizationLd, websiteLd } from "@/lib/structured-data";
import "../globals.css";

type LayoutParams = { params: Promise<{ domain: string }> };

/** Stores are resolved from the request host, so every host renders on demand (then ISR). */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: LayoutParams): Promise<Metadata> {
  const { domain } = await params;
  return rootMetadata(storeApi(domain));
}

export async function generateViewport({ params }: LayoutParams): Promise<Viewport> {
  const { domain } = await params;
  const settings = await storeApi(domain).getSettings();
  return {
    themeColor: safeColor(settings.theme.primary_color, "#4f46e5"),
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({ children, params }: LayoutParams & { children: React.ReactNode }) {
  const { domain } = await params;
  const api = storeApi(domain);
  const [settings, pages] = await Promise.all([api.getSettings(), api.getPages()]);
  const siteUrl = getSiteUrl(settings, api.ctx);
  const { theme, general, seo } = settings;
  const primary = safeColor(theme.primary_color, "#4f46e5");

  const style = {
    "--color-primary": primary,
    "--color-secondary": safeColor(theme.secondary_color, "#0f172a"),
    "--color-accent": safeColor(theme.accent_color, "#f59e0b"),
    "--primary-foreground": readableOn(primary),
    "--radius": RADIUS[theme.border_radius] ?? RADIUS.md,
    "--font-store": fontVar(theme.font_family),
  } as React.CSSProperties;

  return (
    <html lang={(general.locale || "en").split("-")[0]} style={style}>
      <body className="flex min-h-screen flex-col bg-white text-slate-900">
        <GtmNoScript seo={seo} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-brand focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
        >
          Skip to content
        </a>
        <StoreProvider
          value={{
            tenant: settings.tenant.slug,
            storeName: general.store_name,
            currency: general.currency,
            locale: general.locale,
            checkout: settings.checkout,
          }}
        >
          <AuthProvider>
            <CartProvider>
              <AnnouncementBar settings={settings} />
              <Header settings={settings} />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer settings={settings} pages={pages} />
              <CartDrawer />
            </CartProvider>
          </AuthProvider>
        </StoreProvider>
        {seo.organization_schema && <JsonLd data={[organizationLd(settings, siteUrl), websiteLd(settings, siteUrl)]} />}
        <Analytics seo={seo} />
      </body>
    </html>
  );
}
