import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiList, apiPost, apiPut } from "@/lib/api";
import { toastError } from "@/lib/errors";
import { cleanParams } from "@/lib/utils";
import { useScope } from "@/lib/scope";
import type { ListParams, Paginated } from "@/types";

export const listKey = (scope: string, path: string, params?: unknown) => [scope, path, "list", params ?? {}] as const;
export const detailKey = (scope: string, path: string, id?: string) => [scope, path, "detail", id] as const;

/** Paginated list query that drives DataTable. */
export function useListQuery<T>(resourcePath: string, params: ListParams = {}, opts: { enabled?: boolean } = {}) {
  const scope = useScope();
  const clean = cleanParams(params);
  return useQuery<Paginated<T>>({
    queryKey: listKey(scope, resourcePath, clean),
    queryFn: () => apiList<T>(scope, resourcePath, clean),
    placeholderData: keepPreviousData,
    enabled: opts.enabled ?? true,
  });
}

/** Unpaginated `?all=true` list, e.g. categories/brands for selects. */
export function useAllQuery<T>(resourcePath: string, extra: Record<string, unknown> = {}, enabled = true) {
  const scope = useScope();
  return useQuery<T[]>({
    queryKey: [scope, resourcePath, "all", extra],
    queryFn: async () => {
      const res = await apiList<T>(scope, resourcePath, { all: true, limit: 100, ...extra });
      return res.data;
    },
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useDetailQuery<T>(resourcePath: string, id?: string, opts: { enabled?: boolean } = {}) {
  const scope = useScope();
  return useQuery<T>({
    queryKey: detailKey(scope, resourcePath, id),
    queryFn: () => apiGet<T>(scope, `${resourcePath}/${id}`),
    enabled: !!id && (opts.enabled ?? true),
  });
}

export function useGetQuery<T>(path: string, params?: Record<string, unknown>, opts: { enabled?: boolean; refetchInterval?: number } = {}) {
  const scope = useScope();
  const clean = params ? cleanParams(params) : undefined;
  return useQuery<T>({
    queryKey: [scope, path, "get", clean ?? {}],
    queryFn: () => apiGet<T>(scope, path, clean),
    enabled: opts.enabled ?? true,
    refetchInterval: opts.refetchInterval,
  });
}

interface MutationOpts {
  successMessage?: string | false;
  /** Additional resource paths to invalidate. */
  invalidate?: string[];
}

function useInvalidate() {
  const qc = useQueryClient();
  const scope = useScope();
  return (paths: string[]) => Promise.all(paths.map((p) => qc.invalidateQueries({ queryKey: [scope, p] })));
}

export function useCreateMutation<TBody, TResult = unknown>(resourcePath: string, opts: MutationOpts = {}) {
  const scope = useScope();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: TBody) => apiPost<TResult>(scope, resourcePath, body),
    onSuccess: async () => {
      await invalidate([resourcePath, ...(opts.invalidate ?? [])]);
      if (opts.successMessage !== false) toast.success(opts.successMessage ?? "Created successfully");
    },
  });
}

export function useUpdateMutation<TBody, TResult = unknown>(resourcePath: string, opts: MutationOpts = {}) {
  const scope = useScope();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TBody }) => apiPut<TResult>(scope, `${resourcePath}/${id}`, body),
    onSuccess: async () => {
      await invalidate([resourcePath, ...(opts.invalidate ?? [])]);
      if (opts.successMessage !== false) toast.success(opts.successMessage ?? "Saved successfully");
    },
  });
}

export function useDeleteMutation(resourcePath: string, opts: MutationOpts = {}) {
  const scope = useScope();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => apiDelete(scope, `${resourcePath}/${id}`),
    onSuccess: async () => {
      await invalidate([resourcePath, ...(opts.invalidate ?? [])]);
      if (opts.successMessage !== false) toast.success(opts.successMessage ?? "Deleted");
    },
    onError: (e) => toastError(e),
  });
}

/** POST to an arbitrary action path (e.g. `/tenants/:id/suspend`). */
export function useActionMutation<TVars, TResult = unknown>(
  build: (vars: TVars) => { path: string; body?: unknown; method?: "post" | "put" },
  opts: MutationOpts & { resourcePath: string },
) {
  const scope = useScope();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (vars: TVars) => {
      const { path, body, method } = build(vars);
      return method === "put" ? apiPut<TResult>(scope, path, body) : apiPost<TResult>(scope, path, body);
    },
    onSuccess: async () => {
      await invalidate([opts.resourcePath, ...(opts.invalidate ?? [])]);
      if (opts.successMessage !== false) toast.success(opts.successMessage ?? "Done");
    },
    onError: (e) => toastError(e),
  });
}
