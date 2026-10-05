import axios, { AxiosHeaders, type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "@/lib/env";
import { authStore } from "@/lib/auth-store";
import { toApiError } from "@/lib/errors";
import type { ApiSuccess, LoginResponse, PageMeta, Paginated, Scope } from "@/types";

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const AUTH_PATHS = ["/auth/login", "/auth/refresh"];

/** Called when a scope's session can no longer be refreshed. */
let onSessionExpired: (scope: Scope) => void = (scope) => {
  const loginUrl = `/login?scope=${scope === "system" ? "platform" : "merchant"}`;
  if (!window.location.pathname.startsWith("/login")) window.location.assign(loginUrl);
};

export function setSessionExpiredHandler(fn: (scope: Scope) => void) {
  onSessionExpired = fn;
}

const refreshing: Partial<Record<Scope, Promise<string>>> = {};

async function refreshAccessToken(scope: Scope): Promise<string> {
  const existing = refreshing[scope];
  if (existing) return existing;
  const session = authStore.get(scope);
  if (!session?.refresh_token) throw new Error("No refresh token");
  const p = axios
    .post<ApiSuccess<LoginResponse>>(`${API_URL}/${scope}/auth/refresh`, { refresh_token: session.refresh_token })
    .then((res) => {
      const d = res.data.data;
      authStore.update(scope, {
        access_token: d.access_token,
        refresh_token: d.refresh_token,
        ...(d.user ? { user: d.user } : {}),
      });
      return d.access_token;
    })
    .finally(() => {
      delete refreshing[scope];
    });
  refreshing[scope] = p;
  return p;
}

function createClient(scope: Scope): AxiosInstance {
  const instance = axios.create({
    baseURL: `${API_URL}/${scope}`,
    headers: { Accept: "application/json" },
    timeout: 30000,
  });

  instance.interceptors.request.use((config) => {
    const token = authStore.get(scope)?.access_token;
    if (token) {
      const headers = AxiosHeaders.from(config.headers);
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;
      const status = error.response?.status;
      const url = original?.url ?? "";
      const isAuthCall = AUTH_PATHS.some((p) => url.includes(p));

      if (status === 401 && original && !original._retry && !isAuthCall && authStore.get(scope)?.refresh_token) {
        original._retry = true;
        try {
          // Concurrent 401s share a single in-flight refresh promise (request queue).
          const token = await refreshAccessToken(scope);
          const headers = AxiosHeaders.from(original.headers);
          headers.set("Authorization", `Bearer ${token}`);
          original.headers = headers;
          return instance(original);
        } catch {
          authStore.clear(scope);
          onSessionExpired(scope);
          return Promise.reject(toApiError(error));
        }
      }
      if (status === 401 && !isAuthCall) {
        authStore.clear(scope);
        onSessionExpired(scope);
      }
      return Promise.reject(toApiError(error));
    },
  );

  return instance;
}

const clients: Record<Scope, AxiosInstance> = {
  tenant: createClient("tenant"),
  system: createClient("system"),
};

export function getClient(scope: Scope): AxiosInstance {
  return clients[scope];
}

/* ------------- typed helpers that unwrap the {success,data,meta} envelope ------------- */

type Params = Record<string, unknown>;

export async function apiGet<T>(scope: Scope, path: string, params?: Params): Promise<T> {
  const res = await clients[scope].get<ApiSuccess<T>>(path, { params });
  return res.data.data;
}

export async function apiList<T>(scope: Scope, path: string, params?: Params): Promise<Paginated<T>> {
  const res = await clients[scope].get<ApiSuccess<T[]>>(path, { params });
  const data = Array.isArray(res.data.data) ? res.data.data : [];
  const meta: PageMeta = res.data.meta ?? {
    page: 1,
    limit: data.length,
    total: data.length,
    total_pages: 1,
  };
  return { data, meta };
}

export async function apiPost<T>(scope: Scope, path: string, body?: unknown): Promise<T> {
  const res = await clients[scope].post<ApiSuccess<T>>(path, body ?? {});
  return res.data.data;
}

export async function apiPut<T>(scope: Scope, path: string, body?: unknown): Promise<T> {
  const res = await clients[scope].put<ApiSuccess<T>>(path, body ?? {});
  return res.data.data;
}

export async function apiDelete<T = unknown>(scope: Scope, path: string): Promise<T> {
  const res = await clients[scope].delete<ApiSuccess<T>>(path);
  return res.data?.data;
}

export async function apiUpload<T>(scope: Scope, path: string, file: File, field = "file"): Promise<T> {
  const fd = new FormData();
  fd.append(field, file);
  const res = await clients[scope].post<ApiSuccess<T>>(path, fd);
  return res.data.data;
}

/** Login without the auth interceptor flow. */
export async function login(scope: Scope, body: Record<string, string>): Promise<LoginResponse> {
  try {
    const res = await axios.post<ApiSuccess<LoginResponse>>(`${API_URL}/${scope}/auth/login`, body);
    return res.data.data;
  } catch (e) {
    throw toApiError(e);
  }
}

export async function logout(scope: Scope): Promise<void> {
  const session = authStore.get(scope);
  try {
    if (session) await clients[scope].post("/auth/logout", { refresh_token: session.refresh_token });
  } catch {
    /* ignore */
  } finally {
    authStore.clear(scope);
  }
}
