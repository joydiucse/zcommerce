export interface MoneyOptions {
  currency?: string;
  locale?: string;
  symbol?: string;
}

export function formatMoney(amount: number | string | null | undefined, opts: MoneyOptions = {}): string {
  const value = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  const n = Number.isFinite(value) ? value : 0;
  const currency = opts.currency || "USD";
  const locale = opts.locale || "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${opts.symbol ?? "$"}${n.toFixed(2)}`;
  }
}

export function formatNumber(value: number | null | undefined, locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(value ?? 0);
}

export function formatCompact(value: number | null | undefined, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value ?? 0);
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(v: string | Date | null | undefined, locale = "en-US"): string {
  const d = toDate(v);
  if (!d) return "—";
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(v: string | Date | null | undefined, locale = "en-US"): string {
  const d = toDate(v);
  if (!d) return "—";
  return d.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(v: string | Date | null | undefined): string {
  const d = toDate(v);
  if (!d) return "—";
  const diff = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), "month");
  return rtf.format(Math.round(diff / (86400 * 365)), "year");
}

/** YYYY-MM-DD in local time. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

/** Convert an ISO timestamp to a value usable by <input type="datetime-local">. */
export function toDateTimeLocal(v: string | null | undefined): string {
  const d = toDate(v);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDateTimeLocal(v: string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function humanize(v: string | null | undefined): string {
  if (!v) return "";
  return v.replace(/[_.]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
