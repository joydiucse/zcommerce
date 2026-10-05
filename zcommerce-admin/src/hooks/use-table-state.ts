import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useDebounce } from "@/hooks/use-debounce";
import type { ListParams } from "@/types";

export interface TableStateOptions {
  defaultSort?: string;
  defaultOrder?: "asc" | "desc";
  defaultLimit?: number;
  /** Filter param names that are persisted in the URL. */
  filterKeys?: string[];
  /** Prefix for URL keys, so several tables can live on one page. */
  prefix?: string;
}

export interface TableState {
  page: number;
  limit: number;
  search: string;
  searchInput: string;
  sort: string;
  order: "asc" | "desc";
  filters: Record<string, string>;
  params: ListParams;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearchInput: (value: string) => void;
  setSort: (sort: string, order: "asc" | "desc") => void;
  setFilter: (key: string, value: string | undefined) => void;
  setFilters: (patch: Record<string, string | undefined>) => void;
  resetFilters: () => void;
}

/** Table state (pagination/sort/search/filters) persisted in URL search params. */
export function useTableState(opts: TableStateOptions = {}): TableState {
  const { defaultSort = "created_at", defaultOrder = "desc", defaultLimit = 20 } = opts;
  const filterKeysStr = (opts.filterKeys ?? []).join(",");
  const prefix = opts.prefix ?? "";
  const [sp, setSp] = useSearchParams();
  const k = (name: string) => `${prefix}${name}`;

  const page = Math.max(1, Number(sp.get(k("page"))) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get(k("limit"))) || defaultLimit));
  const search = sp.get(k("search")) ?? "";
  const sort = sp.get(k("sort")) ?? defaultSort;
  const order = (sp.get(k("order")) as "asc" | "desc" | null) ?? defaultOrder;

  const filters = useMemo(() => {
    const out: Record<string, string> = {};
    for (const key of filterKeysStr ? filterKeysStr.split(",") : []) {
      const v = sp.get(`${prefix}${key}`);
      if (v) out[key] = v;
    }
    return out;
  }, [sp, filterKeysStr, prefix]);

  const update = useCallback(
    (patch: Record<string, string | number | undefined>, resetPage = true) => {
      setSp(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, v] of Object.entries(patch)) {
            if (v === undefined || v === "" || v === "all") next.delete(`${prefix}${key}`);
            else next.set(`${prefix}${key}`, String(v));
          }
          if (resetPage && !("page" in patch)) next.delete(`${prefix}page`);
          return next;
        },
        { replace: true },
      );
    },
    [setSp, prefix],
  );

  const [searchInput, setSearchInput] = useState(search);
  const debounced = useDebounce(searchInput, 400);
  useEffect(() => {
    if (debounced !== search) update({ search: debounced || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const params: ListParams = useMemo(
    () => ({ page, limit, search: search || undefined, sort, order, ...filters }),
    [page, limit, search, sort, order, filters],
  );

  return {
    page,
    limit,
    search,
    searchInput,
    sort,
    order,
    filters,
    params,
    setPage: (p) => update({ page: p > 1 ? p : undefined }, false),
    setLimit: (l) => update({ limit: l }),
    setSearchInput,
    setSort: (s, o) => update({ sort: s, order: o }),
    setFilter: (k, v) => update({ [k]: v }),
    setFilters: (patch) => update(patch),
    resetFilters: () => {
      const patch: Record<string, undefined> = { search: undefined };
      for (const key of Object.keys(filters)) patch[key] = undefined;
      setSearchInput("");
      update(patch);
    },
  };
}
