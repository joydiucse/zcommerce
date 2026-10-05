"use client";

import { createContext, useCallback, useContext } from "react";
import { setClientTenant } from "@/lib/client-api";
import { formatMoney } from "@/lib/format";
import type { CheckoutSettings } from "@/lib/types";

export interface StoreContextValue {
  tenant: string;
  storeName: string;
  currency: string;
  locale: string;
  checkout: CheckoutSettings;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ value, children }: { value: StoreContextValue; children: React.ReactNode }) {
  // Set synchronously so child effects already send X-Tenant.
  setClientTenant(value.tenant);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useMoney() {
  const { currency, locale } = useStore();
  return useCallback(
    (n: number | null | undefined, cur?: string) => formatMoney(n, { currency: cur || currency, locale }),
    [currency, locale],
  );
}
