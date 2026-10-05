import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { TbFilterOff, TbSearch, TbX } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import type { TableState } from "@/hooks/use-table-state";
import { cn } from "@/lib/utils";
import type { PageMeta } from "@/types";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
  width?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[] | undefined;
  meta?: PageMeta;
  isLoading?: boolean;
  isFetching?: boolean;
  state: TableState;
  searchPlaceholder?: string;
  hideSearch?: boolean;
  filters?: FilterDef[];
  /** Extra controls rendered in the toolbar (e.g. date range). */
  toolbarExtra?: ReactNode;
  enableSelection?: boolean;
  bulkActions?: (selected: T[], clear: () => void) => ReactNode;
  getRowId?: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Storage key for column visibility. */
  tableId?: string;
}

function loadVisibility(id?: string): VisibilityState {
  if (!id) return {};
  try {
    return JSON.parse(localStorage.getItem(`zc.cols.${id}`) ?? "{}") as VisibilityState;
  } catch {
    return {};
  }
}

export function selectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 32,
  };
}

export function DataTable<T>({
  columns,
  data,
  meta,
  isLoading,
  isFetching,
  state,
  searchPlaceholder = "Search…",
  hideSearch,
  filters,
  toolbarExtra,
  enableSelection,
  bulkActions,
  getRowId,
  onRowClick,
  emptyTitle = "No results found",
  emptyDescription,
  emptyAction,
  tableId,
}: DataTableProps<T>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => loadVisibility(tableId));
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    if (!tableId) return;
    try {
      localStorage.setItem(`zc.cols.${tableId}`, JSON.stringify(columnVisibility));
    } catch {
      /* ignore */
    }
  }, [columnVisibility, tableId]);

  // Reset selection whenever the visible page changes.
  const paramsKey = JSON.stringify(state.params);
  useEffect(() => setRowSelection({}), [paramsKey]);

  const allColumns = useMemo(
    () => (enableSelection ? [selectColumn<T>(), ...columns] : columns),
    [columns, enableSelection],
  );

  const sorting: SortingState = useMemo(
    () => (state.sort ? [{ id: state.sort, desc: state.order === "desc" }] : []),
    [state.sort, state.order],
  );

  const rows = useMemo(() => data ?? [], [data]);

  const table = useReactTable({
    data: rows,
    columns: allColumns,
    getRowId: getRowId
      ? (r) => getRowId(r)
      : (r, i) => {
          const id = (r as { id?: unknown }).id;
          return typeof id === "string" ? id : String(i);
        },
    state: { sorting, columnVisibility, rowSelection },
    defaultColumn: { enableSorting: false },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: meta?.total_pages ?? -1,
    enableRowSelection: !!enableSelection,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      if (first) state.setSort(first.id, first.desc ? "desc" : "asc");
      else state.setSort("created_at", "desc");
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const hasFilters = !!state.search || Object.keys(state.filters).length > 0;
  const colCount = table.getVisibleLeafColumns().length;

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {!hideSearch && (
            <div className="relative w-full sm:w-64">
              <TbSearch className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={state.searchInput}
                onChange={(e) => state.setSearchInput(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 pr-8 pl-8"
              />
              {state.searchInput && (
                <button
                  type="button"
                  onClick={() => state.setSearchInput("")}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                  aria-label="Clear search"
                >
                  <TbX className="size-4" />
                </button>
              )}
            </div>
          )}
          {filters?.map((f) => (
            <Select
              key={f.key}
              value={state.filters[f.key] ?? "all"}
              onValueChange={(v) => state.setFilter(f.key, v === "all" ? undefined : v)}
            >
              <SelectTrigger size="sm" className={cn("w-auto min-w-[130px]", f.width)}>
                <span className="text-muted-foreground text-xs">{f.label}:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {toolbarExtra}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={state.resetFilters} className="text-muted-foreground h-8">
              <TbFilterOff /> Reset
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFetching && !isLoading && <span className="bg-primary size-2 animate-pulse rounded-full" title="Refreshing" />}
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Bulk actions bar */}
      {enableSelection && selected.length > 0 && (
        <div className="bg-primary/5 flex flex-wrap items-center gap-2 border-b px-3 py-2 text-sm">
          <span className="font-medium">{selected.length} selected</span>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => table.resetRowSelection()}>
            Clear
          </Button>
          <div className="ml-auto flex flex-wrap gap-2">{bulkActions?.(selected, () => table.resetRowSelection())}</div>
        </div>
      )}

      <Table>
        <TableHeader className="bg-muted/40">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((h) => (
                <TableHead key={h.id} style={h.column.id === "select" ? { width: 40 } : undefined}>
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: Math.min(state.limit, 8) }).map((_, i) => (
              <TableRow key={`sk-${i}`} className="hover:bg-transparent">
                {Array.from({ length: colCount }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className={cn("h-4", j === 0 ? "w-4" : "w-full max-w-[160px]")} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(onRowClick && "cursor-pointer", isFetching && "opacity-70")}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colCount} className="p-0">
                <EmptyState
                  title={emptyTitle}
                  description={hasFilters ? "Try adjusting your search or filters." : emptyDescription}
                  action={hasFilters ? undefined : emptyAction}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <DataTablePagination state={state} meta={meta} />
    </div>
  );
}
