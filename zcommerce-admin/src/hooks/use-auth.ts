import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useSession } from "@/lib/auth-store";
import { hasPermission } from "@/lib/permissions";
import { useScope } from "@/lib/scope";
import type { MeResponse, Scope } from "@/types";

export const meKey = (scope: Scope) => [scope, "auth", "me"] as const;

export function useMe(scopeOverride?: Scope) {
  const ctxScope = useScope();
  const scope = scopeOverride ?? ctxScope;
  const session = useSession(scope);
  return useQuery({
    queryKey: meKey(scope),
    queryFn: () => apiGet<MeResponse>(scope, "/auth/me"),
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function usePermissions() {
  const me = useMe();
  const perms = me.data?.permissions;
  const can = useCallback((key?: string | string[]) => hasPermission(perms, key), [perms]);
  return { can, permissions: perms ?? [], isLoading: me.isLoading };
}
