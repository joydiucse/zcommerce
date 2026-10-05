import { useEffect, type ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { TbLock, TbPlugConnectedX, TbRefresh } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { FullPageLoader } from "@/components/common/loaders";
import { useMe, usePermissions } from "@/hooks/use-auth";
import { logout } from "@/lib/api";
import { authStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/errors";
import { useSession } from "@/lib/auth-store";
import { ScopeProvider } from "@/lib/scope";
import type { Scope } from "@/types";

function AuthGate({ scope, children }: { scope: Scope; children: ReactNode }) {
  const me = useMe(scope);
  const navigate = useNavigate();
  const err = me.error;
  // A valid JWT whose user/tenant no longer exists (e.g. DB re-seeded): drop the session.
  const stale = err instanceof ApiError && (err.status === 401 || err.status === 404);
  useEffect(() => {
    if (stale) {
      authStore.clear(scope);
      navigate(`/login?scope=${scope === "system" ? "platform" : "merchant"}`, { replace: true });
    }
  }, [stale, scope, navigate]);

  if (me.isLoading || stale) return <FullPageLoader label="Loading your workspace…" />;
  if (me.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
          <TbPlugConnectedX className="size-7" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Couldn't load your account</h1>
          <p className="text-muted-foreground mt-1 max-w-md text-sm">{me.error.message}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => me.refetch()}>
            <TbRefresh /> Retry
          </Button>
          <Button
            onClick={async () => {
              await logout(scope);
              navigate(`/login?scope=${scope === "system" ? "platform" : "merchant"}`, { replace: true });
            }}
          >
            Sign in again
          </Button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

/** Requires a session for the given scope and loads `/auth/me` (permissions). */
export function RequireAuth({ scope, children }: { scope: Scope; children: ReactNode }) {
  const session = useSession(scope);
  const location = useLocation();
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?scope=${scope === "system" ? "platform" : "merchant"}&next=${next}`} replace />;
  }
  return (
    <ScopeProvider scope={scope}>
      <AuthGate scope={scope}>{children}</AuthGate>
    </ScopeProvider>
  );
}

export function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
        <TbLock className="size-7" />
      </div>
      <h1 className="text-xl font-semibold">Access denied</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        You don't have permission to view this page. Ask a store owner to update your role.
      </p>
    </div>
  );
}

/** Route-level permission check. */
export function RequirePermission({ perm, children }: { perm: string | string[]; children?: ReactNode }) {
  const { can } = usePermissions();
  if (!can(perm)) return <Forbidden />;
  return <>{children ?? <Outlet />}</>;
}

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-primary text-5xl font-bold">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground text-sm">The page you're looking for doesn't exist.</p>
      <Button asChild variant="outline">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
