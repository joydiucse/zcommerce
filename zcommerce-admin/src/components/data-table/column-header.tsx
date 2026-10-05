import type { Column } from "@tanstack/react-table";
import { TbArrowDown, TbArrowUp, TbArrowsSort } from "react-icons/tb";
import { cn } from "@/lib/utils";

/** Sortable column header. Column id must match the backend `sort` field. */
export function ColumnHeader<T>({ column, title, className }: { column: Column<T>; title: string; className?: string }) {
  if (!column.getCanSort()) return <span className={className}>{title}</span>;
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "hover:text-foreground -ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase transition-colors",
        sorted && "text-foreground",
        className,
      )}
    >
      {title}
      {sorted === "desc" ? (
        <TbArrowDown className="size-3.5" />
      ) : sorted === "asc" ? (
        <TbArrowUp className="size-3.5" />
      ) : (
        <TbArrowsSort className="size-3.5 opacity-40" />
      )}
    </button>
  );
}
