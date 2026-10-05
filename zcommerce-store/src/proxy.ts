import { NextResponse, type NextRequest } from "next/server";
import { domainKeyFromHost, normalizeHost } from "@/lib/tenant-key";

/**
 * Multi-tenant routing. The request host (incl. port) decides the store:
 *  - known host   → rewrite to /<host-key>/<path> (app/[domain]/...), one ISR cache per host
 *  - unknown host → rewrite to /store-unavailable/not_found (platform landing, HTTP 404)
 *  - suspended    → rewrite to /store-unavailable/suspended (HTTP 503)
 * The backend owns the mapping (tenants.site_url / custom_domain / <slug>.<STORE_BASE_DOMAIN>);
 * lookups are cached in memory for a short time so the proxy adds no per-request round trip.
 */

type Resolution = "ok" | "not_found" | "suspended";

const API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");
const HIT_TTL = 30_000;
const MISS_TTL = 10_000;
const cache = new Map<string, { value: Resolution; expires: number }>();

async function resolveHost(host: string): Promise<Resolution> {
  const hit = cache.get(host);
  if (hit && hit.expires > Date.now()) return hit.value;

  let value: Resolution = "ok";
  try {
    const res = await fetch(`${API_URL}/store/resolve`, {
      headers: { Accept: "application/json", "X-Store-Domain": host },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
      const code = body?.error?.code;
      if (code === "TENANT_NOT_FOUND") value = "not_found";
      else if (code === "TENANT_SUSPENDED") value = "suspended";
      else return "ok"; // backend trouble: let the pages render their own fallbacks, don't cache
    }
  } catch {
    return "ok"; // API unreachable: don't cache, don't block the store
  }
  cache.set(host, { value, expires: Date.now() + (value === "ok" ? HIT_TTL : MISS_TTL) });
  if (cache.size > 1000) cache.delete(cache.keys().next().value as string);
  return value;
}

export async function proxy(req: NextRequest) {
  const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const host = normalizeHost(rawHost);
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();

  const resolution: Resolution = host ? await resolveHost(host) : "not_found";
  if (resolution !== "ok") {
    // The page renders "not found" via notFound() (HTTP 404); suspended stores get a 503.
    url.pathname = `/store-unavailable/${resolution}`;
    url.search = "";
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-zc-store-host", host || (rawHost ?? "").slice(0, 255));
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
      ...(resolution === "suspended" ? { status: 503 } : {}),
    });
  }

  const key = domainKeyFromHost(host);
  // Already-internal URLs (e.g. generated opengraph-image links) pass straight through.
  if (pathname === `/${key}` || pathname.startsWith(`/${key}/`)) return NextResponse.next();
  url.pathname = `/${key}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|sitemap.xml|robots.txt|manifest.webmanifest|favicon.ico|icon.svg|placeholder.svg|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|map|txt|xml|woff2?)$).*)",
  ],
};
