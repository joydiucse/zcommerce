import { useMemo } from "react";
import { useAllQuery } from "@/hooks/use-resource";
import type { Brand, Category } from "@/types";

export function useCategoryOptions() {
  const q = useAllQuery<Category>("/categories");
  const options = useMemo(() => {
    const list = q.data ?? [];
    const byId = new Map(list.map((c) => [c.id, c]));
    const label = (c: Category): string => {
      const parent = c.parent_id ? byId.get(c.parent_id) : undefined;
      return parent ? `${label(parent)} › ${c.name}` : c.name;
    };
    return list.map((c) => ({ value: c.id, label: label(c) })).sort((a, b) => a.label.localeCompare(b.label));
  }, [q.data]);
  return { ...q, options };
}

export function useBrandOptions() {
  const q = useAllQuery<Brand>("/brands");
  const options = useMemo(
    () => (q.data ?? []).map((b) => ({ value: b.id, label: b.name })).sort((a, b) => a.label.localeCompare(b.label)),
    [q.data],
  );
  return { ...q, options };
}
