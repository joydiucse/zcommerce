/** Shared by src/proxy.ts and the server API layer (no server-only imports here). */

/**
 * Normalises a Host header the same way the backend does: lower-case, no trailing dot,
 * default ports (80/443) dropped, other ports kept (localhost:3001 and localhost:3002 are
 * different stores). Returns "" for anything that isn't a plain host[:port].
 */
export function normalizeHost(host: string | null | undefined): string {
  const h = (host || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/\.(?=:\d+$|$)/, "")
    .replace(/:(80|443)$/, "");
  return /^[a-z0-9.-]+(:\d{1,5})?$/.test(h) ? h : "";
}

/**
 * [domain] route segment for a host. ":" becomes "_" (never valid in a hostname) so the key is
 * a clean path segment: "localhost:3002" → "localhost_3002".
 */
export function domainKeyFromHost(host: string | null | undefined): string {
  return normalizeHost(host).replace(":", "_");
}

/** Inverse of domainKeyFromHost: "localhost_3002" → "localhost:3002". */
export function hostFromDomainKey(key: string): string {
  let k = key;
  try {
    k = decodeURIComponent(key);
  } catch {
    // keep raw
  }
  return normalizeHost(k.replace(/_(\d{1,5})$/, ":$1"));
}
