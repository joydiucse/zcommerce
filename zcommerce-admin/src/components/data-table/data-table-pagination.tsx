import { TbChevronLeft, TbChevronRight, TbChevronsLeft, TbChevronsRight } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TableState } from "@/hooks/use-table-state";
import { formatNumber } from "@/lib/format";
import type { PageMeta } from "@/types";

const SIZES = [10, 20, 50, 100];

export function DataTablePagination({ state, meta }: { state: TableState; meta?: PageMeta }) {
  const total = meta?.total ?? 0;
  const totalPages = Math.max(1, meta?.total_pages ?? 1);
  const page = Math.min(state.page, totalPages);
  const from = total === 0 ? 0 : (page - 1) * state.limit + 1;
  const to = Math.min(total, page * state.limit);

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 border-t px-3 py-2.5 sm:flex-row">
      <p className="text-muted-foreground text-xs">
        {total > 0 ? (
          <>
            Showing <span className="text-foreground font-medium">{formatNumber(from)}</span>–
            <span className="text-foreground font-medium">{formatNumber(to)}</span> of{" "}
            <span className="text-foreground font-medium">{formatNumber(total)}</span>
          </>
        ) : (
          "No records"
        )}
      </p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground hidden text-xs sm:inline">Rows per page</span>
          <Select value={String(state.limit)} onValueChange={(v) => state.setLimit(Number(v))}>
            <SelectTrigger size="sm" className="w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs font-medium whitespace-nowrap">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => state.setPage(1)} disabled={page <= 1} aria-label="First page">
            <TbChevronsLeft />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => state.setPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
            <TbChevronLeft />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => state.setPage(page + 1)} disabled={page >= totalPages} aria-label="Next page">
            <TbChevronRight />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => state.setPage(totalPages)} disabled={page >= totalPages} aria-label="Last page">
            <TbChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
