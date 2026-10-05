export interface MoneyFormat {
  currency: string;
  locale: string;
}

const cache = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number | null | undefined, { currency, locale }: MoneyFormat): string {
  const value = Number(amount ?? 0);
  const key = `${locale}|${currency}`;
  let nf = cache.get(key);
  if (!nf) {
    try {
      nf = new Intl.NumberFormat(locale || "en-US", { style: "currency", currency: currency || "USD" });
    } catch {
      nf = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    }
    cache.set(key, nf);
  }
  return nf.format(Number.isFinite(value) ? value : 0);
}

export function formatDate(iso: string | null | undefined, locale = "en-US"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export function discountPercent(price: number, compareAt: number | null | undefined): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function stripHtml(html: string | null | undefined): string {
  return (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

export function titleCase(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Light defensive clean-up for merchant-authored HTML (descriptions, CMS pages):
 * drops script/style/iframe/object tags, inline event handlers and javascript: URLs.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<(script|style|iframe|object|embed|noscript)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}
