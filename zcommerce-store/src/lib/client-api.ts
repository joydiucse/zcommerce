"use client";

import type { ApiMeta, AuthTokens, Envelope } from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/$/, "");

let currentTenant = "";

export function setClientTenant(slug: string) {
  currentTenant = slug;
}

export function getClientTenant() {
  return currentTenant;
}

export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

/* ------------------------------------------------------------ storage utils */

function lsGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

const authKey = () => `zc:${currentTenant || "store"}:auth`;
const cartKey = () => `zc:${currentTenant || "store"}:cart`;
const cartCookie = () => `zc_cart_${(currentTenant || "store").replace(/[^a-z0-9_-]/gi, "")}`;

export function getStoredAuth(): Omit<AuthTokens, "user"> | null {
  const raw = lsGet(authKey());
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(tokens: Pick<AuthTokens, "access_token" | "refresh_token" | "expires_in"> | null) {
  lsSet(
    authKey(),
    tokens
      ? JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
        })
      : null,
  );
}

export function getCartToken(): string | null {
  const ls = lsGet(cartKey());
  if (ls) return ls;
  const m = document.cookie.match(new RegExp(`(?:^|; )${cartCookie()}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function setCartToken(token: string | null) {
  lsSet(cartKey(), token);
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = token
    ? `${cartCookie()}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax${secure}`
    : `${cartCookie()}=; path=/; max-age=0; samesite=lax${secure}`;
}

/* ------------------------------------------------------------------ request */

type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  auth?: boolean;
  cartToken?: string | null;
  signal?: AbortSignal;
}

let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const stored = getStoredAuth();
  if (!stored?.refresh_token) return false;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await raw<AuthTokens>("/store/customers/refresh", {
          method: "POST",
          body: { refresh_token: stored.refresh_token },
        });
        setStoredAuth(res.data);
        return true;
      } catch {
        setStoredAuth(null);
        window.dispatchEvent(new Event("zc:auth-expired"));
        return false;
      } finally {
        setTimeout(() => (refreshing = null), 0);
      }
    })();
  }
  return refreshing;
}

async function raw<T>(path: string, opts: RequestOptions = {}): Promise<{ data: T; meta?: ApiMeta }> {
  const url = new URL(API_URL + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (currentTenant) headers["X-Tenant"] = currentTenant;
  if (opts.cartToken) headers["X-Cart-Token"] = opts.cartToken;
  if (opts.auth) {
    const t = getStoredAuth();
    if (t?.access_token) headers.Authorization = `Bearer ${t.access_token}`;
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
      cache: "no-store",
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    throw new ClientApiError(0, "Can't reach the store right now. Please check your connection and try again.");
  }
  let body: Envelope<T> | null = null;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    body = null;
  }
  if (!res.ok || !body || body.success === false) {
    const err = body?.error;
    throw new ClientApiError(res.status, err?.message || `Request failed (${res.status})`, err?.code, err?.details);
  }
  return { data: body.data as T, meta: body.meta };
}

/** Browser API client. Retries once after refreshing the customer token on 401. */
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<{ data: T; meta?: ApiMeta }> {
  try {
    return await raw<T>(path, opts);
  } catch (e) {
    if (opts.auth && e instanceof ClientApiError && e.status === 401 && getStoredAuth()?.refresh_token) {
      const ok = await refreshTokens();
      if (ok) return raw<T>(path, opts);
    }
    throw e;
  }
}

export function errorMessage(e: unknown): string {
  if (e instanceof ClientApiError) {
    if (e.details?.length) return e.details.map((d) => d.message).join(" ");
    return e.message;
  }
  return "Something went wrong. Please try again.";
}
