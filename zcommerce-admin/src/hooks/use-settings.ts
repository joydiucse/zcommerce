import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useSession } from "@/lib/auth-store";
import { formatMoney } from "@/lib/format";
import { useScope } from "@/lib/scope";
import type { TenantSettings } from "@/types";

export const settingsKey = ["tenant", "/settings", "all"] as const;

export function useTenantSettings(enabled = true) {
  const session = useSession("tenant");
  return useQuery({
    queryKey: settingsKey,
    queryFn: () => apiGet<TenantSettings>("tenant", "/settings"),
    enabled: enabled && !!session,
    staleTime: 5 * 60 * 1000,
  });
}

/** Currency formatter bound to settings.general.currency / locale in merchant scope. */
export function useMoney() {
  const scope = useScope();
  const { data } = useTenantSettings(scope === "tenant");
  const currency = scope === "tenant" ? (data?.general?.currency ?? "USD") : "USD";
  const locale = scope === "tenant" ? (data?.general?.locale ?? "en-US") : "en-US";
  const symbol = data?.general?.currency_symbol ?? "$";
  const format = useCallback(
    (amount: number | string | null | undefined, cur?: string) =>
      formatMoney(amount, { currency: cur || currency, locale, symbol }),
    [currency, locale, symbol],
  );
  return { format, currency, locale, symbol };
}
