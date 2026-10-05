import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-auth";

/** Render children only when the current user has (any of) the permission(s). */
export function Can({ perm, children, fallback = null }: { perm?: string | string[]; children: ReactNode; fallback?: ReactNode }) {
  const { can } = usePermissions();
  return <>{can(perm) ? children : fallback}</>;
}
