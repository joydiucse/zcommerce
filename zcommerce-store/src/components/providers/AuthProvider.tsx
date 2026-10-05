"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getStoredAuth, setStoredAuth } from "@/lib/client-api";
import type { Address, AuthTokens, Customer } from "@/lib/types";

interface AuthContextValue {
  customer: Customer | null;
  /** false until the stored session has been checked */
  ready: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
  reload: () => Promise<void>;
  updateProfile: (input: { name: string; phone: string | null; addresses: Address[] }) => Promise<Customer>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** `/customers/me` may return the customer directly or wrapped; accept both. */
function unwrapCustomer(data: unknown): Customer {
  const d = data as { customer?: Customer; user?: Customer } & Customer;
  const c = d?.customer ?? d?.user ?? d;
  return { ...c, addresses: Array.isArray(c?.addresses) ? c.addresses : [] };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    if (!getStoredAuth()?.access_token) {
      setCustomer(null);
      setReady(true);
      return;
    }
    try {
      const { data } = await api<unknown>("/store/customers/me", { auth: true });
      setCustomer(unwrapCustomer(data));
    } catch {
      // token invalid and refresh failed (or API down) — keep tokens only if API is unreachable
      if (!getStoredAuth()) setCustomer(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    // Initial session check on mount; reload() only calls setState after awaiting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const onExpired = () => setCustomer(null);
    window.addEventListener("zc:auth-expired", onExpired);
    return () => window.removeEventListener("zc:auth-expired", onExpired);
  }, [reload]);

  const acceptTokens = useCallback((t: AuthTokens) => {
    setStoredAuth(t);
    if (t.user) setCustomer(unwrapCustomer(t.user));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api<AuthTokens>("/store/customers/login", { method: "POST", body: { email, password } });
      acceptTokens(data);
      await reload();
    },
    [acceptTokens, reload],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string }) => {
      const { data } = await api<Partial<AuthTokens>>("/store/customers/register", { method: "POST", body: input });
      if (data?.access_token) {
        acceptTokens(data as AuthTokens);
        await reload();
      } else {
        await login(input.email, input.password);
      }
    },
    [acceptTokens, login, reload],
  );

  const logout = useCallback(() => {
    setStoredAuth(null);
    setCustomer(null);
  }, []);

  const updateProfile = useCallback(async (input: { name: string; phone: string | null; addresses: Address[] }) => {
    const { data } = await api<unknown>("/store/customers/me", { method: "PUT", body: input, auth: true });
    const c = unwrapCustomer(data);
    setCustomer(c);
    return c;
  }, []);

  const value = useMemo(
    () => ({ customer, ready, isAuthenticated: !!customer, login, register, logout, reload, updateProfile }),
    [customer, ready, login, register, logout, reload, updateProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
