import type { StoreSettings } from "./types";
import type { RequestContext } from "./api";

function clean(url: string) {
  return url.replace(/\/+$/, "");
}

function valid(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    return clean(new URL(url).toString());
  } catch {
    return null;
  }
}

/**
 * Absolute base URL of the storefront for canonical/OG/sitemap URLs.
 * Order: seo.canonical_url → store_url (tenant site_url / custom domain, from the backend)
 * → the request host (e.g. a <slug>.<platform-domain> store with no URL of its own).
 */
export function getSiteUrl(settings: StoreSettings, ctx: RequestContext): string {
  const configured = valid(settings.seo.canonical_url) || valid(settings.store_url);
  if (configured) return configured;
  const host = ctx.host || "localhost";
  const local = /^(localhost|127\.|\[::1\])|\.localhost(:|$)/.test(host);
  return `${local ? "http" : "https"}://${host}`;
}

export function absoluteUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${clean(base)}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const RADIUS: Record<string, string> = {
  none: "0px",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.875rem",
  full: "9999px",
};

// hex, rgb()/hsl()/oklch() or named colours; rejects anything that could break out of CSS
const COLOR = /^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla|oklch|oklab)\([0-9a-z.,%\s/-]+\))$/i;
export function safeColor(value: string | undefined, fallback: string): string {
  return value && COLOR.test(value.trim()) ? value.trim() : fallback;
}

/** Picks white or near-black text for a given hex background (WCAG relative luminance). */
export function readableOn(color: string): string {
  const m = color.match(/^#([0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-f])/i);
  if (!m) return "#ffffff";
  let hex = m[1];
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return l > 0.45 ? "#0f172a" : "#ffffff";
}
