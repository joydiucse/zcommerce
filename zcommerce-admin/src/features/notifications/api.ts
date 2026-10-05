import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiList, apiPost } from "@/lib/api";
import { useSession } from "@/lib/auth-store";
import { toastError } from "@/lib/errors";
import type { AppNotification } from "@/types";

const BASE = "/notifications";

export function useUnreadCount() {
  const session = useSession("tenant");
  return useQuery({
    queryKey: ["tenant", BASE, "unread-count"],
    queryFn: () => apiGet<{ count: number }>("tenant", `${BASE}/unread-count`),
    enabled: !!session,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useRecentNotifications(enabled: boolean) {
  return useQuery({
    queryKey: ["tenant", BASE, "recent"],
    queryFn: () => apiList<AppNotification>("tenant", BASE, { limit: 8, page: 1 }),
    enabled,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost("tenant", `${BASE}/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant", BASE] }),
    onError: (e) => toastError(e),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost("tenant", `${BASE}/read-all`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenant", BASE] }),
    onError: (e) => toastError(e),
  });
}
