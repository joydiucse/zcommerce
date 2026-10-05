import type { Metadata } from "next";
import type { StoreApi } from "./api";
import { absoluteUrl, getSiteUrl } from "./site";
import type { StoreSettings } from "./types";

export interface MetaOptions {
  title?: string;
  description?: string | null;
  /** Path of the page (no host), used for canonical + og:url. Include ?page=N for paginated pages. */
  path: string;
  images?: { url: string; alt?: string | null; width?: number; height?: number }[];
  type?: "website" | "article";
  /** Force noindex (cart, checkout, account, search…). */
  noindex?: boolean;
  keywords?: string | string[] | null;
  /** When true, OG images are left to file-based opengraph-image routes. */
  fileBasedImages?: boolean;
}

export function robotsFor(settings: StoreSettings, noindex = false): Metadata["robots"] {
  const index = settings.seo.robots_index && !noindex;
  return {
    index,
    follow: settings.seo.robots_index,
    googleBot: { index, follow: settings.seo.robots_index, "max-image-preview": "large", "max-snippet": -1 },
  };
}

export function storeTitle(settings: StoreSettings) {
  return settings.seo.meta_title || settings.general.store_name;
}

export function titleTemplate(settings: StoreSettings) {
  const t = settings.seo.title_template;
  return t && t.includes("%s") ? t : `%s | ${settings.general.store_name}`;
}

function twitterHandle(settings: StoreSettings) {
  const h = settings.seo.twitter_handle?.trim();
  if (!h) return undefined;
  return h.startsWith("@") ? h : `@${h}`;
}

/** Per-page metadata. Open Graph / Twitter objects are rebuilt fully because Next merges them shallowly. */
export async function buildMetadata(api: StoreApi, opts: MetaOptions, settingsArg?: StoreSettings): Promise<Metadata> {
  const settings = settingsArg ?? (await api.getSettings());
  const siteUrl = getSiteUrl(settings, api.ctx);
  const description = (opts.description || settings.seo.meta_description || settings.general.tagline || "").trim();
  const url = absoluteUrl(siteUrl, opts.path);
  const fallbackOg = settings.seo.og_image_url ? [{ url: settings.seo.og_image_url, alt: storeTitle(settings) }] : [];
  const images = (opts.images?.length ? opts.images : fallbackOg).map((i) => ({ ...i, alt: i.alt || opts.title || storeTitle(settings) }));
  const title = opts.title;
  const ogTitle = title || storeTitle(settings);
  const keywords = opts.keywords ?? settings.seo.meta_keywords;
  const kw = Array.isArray(keywords)
    ? keywords
    : (keywords || "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

  const meta: Metadata = {
    description: description || undefined,
    keywords: kw.length ? kw : undefined,
    alternates: { canonical: url },
    robots: robotsFor(settings, opts.noindex),
    openGraph: {
      type: opts.type ?? "website",
      url,
      siteName: settings.general.store_name,
      title: ogTitle,
      description: description || undefined,
      locale: settings.general.locale?.replace("-", "_"),
      ...(opts.fileBasedImages || !images.length ? {} : { images }),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: description || undefined,
      site: twitterHandle(settings),
      creator: twitterHandle(settings),
      ...(opts.fileBasedImages || !images.length ? {} : { images: images.map((i) => i.url) }),
    },
  };
  if (title) {
    // Merchant-written meta titles that already carry the store name are used verbatim.
    const store = settings.general.store_name.trim().toLowerCase();
    meta.title = store && title.toLowerCase().includes(store) ? { absolute: title } : title;
  }
  return meta;
}

/** Root (layout) metadata: metadataBase, title template, verification, icons. */
export async function rootMetadata(api: StoreApi): Promise<Metadata> {
  const settings = await api.getSettings();
  const siteUrl = getSiteUrl(settings, api.ctx);
  const base = await buildMetadata(api, { path: "/" }, settings);
  const other: Record<string, string> = {};
  if (settings.seo.bing_site_verification) other["msvalidate.01"] = settings.seo.bing_site_verification;
  const favicon = settings.general.favicon_url;
  return {
    ...base,
    metadataBase: new URL(siteUrl),
    title: { default: storeTitle(settings), template: titleTemplate(settings) },
    applicationName: settings.general.store_name,
    alternates: undefined,
    verification: {
      google: settings.seo.google_site_verification || undefined,
      other: Object.keys(other).length ? other : undefined,
    },
    icons: favicon
      ? { icon: [{ url: favicon }], shortcut: [{ url: favicon }], apple: [{ url: favicon }] }
      : { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
    formatDetection: { telephone: false },
  };
}

/** Builds the canonical path for a listing page, keeping filters and the current page. */
export function listingPath(pathname: string, params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && !(k === "page" && v === "1")) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
