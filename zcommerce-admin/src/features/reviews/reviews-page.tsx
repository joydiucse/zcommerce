import { useMemo } from "react";
import { Link } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { TbCheck, TbStarFilled, TbTrash, TbX } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { usePermissions } from "@/hooks/use-auth";
import { useDeleteMutation, useListQuery } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { apiPut } from "@/lib/api";
import { toastError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Review, ReviewStatus } from "@/types";

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <TbStarFilled key={i} className={cn("size-3.5", i < Math.round(rating) ? "text-amber-500" : "text-muted-foreground/30")} />
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const { can } = usePermissions();
  const qc = useQueryClient();
  const state = useTableState({ filterKeys: ["status", "product_id", "rating"] });
  const { data, isLoading, isFetching } = useListQuery<Review>("/reviews", state.params);
  const del = useDeleteMutation("/reviews", { successMessage: "Review deleted" });
  const confirm = useConfirmState<Review>();

  const setStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ReviewStatus }) => {
      await Promise.all(ids.map((id) => apiPut("tenant", `/reviews/${id}`, { status })));
    },
    onSuccess: async (_d, v) => {
      await qc.invalidateQueries({ queryKey: ["tenant", "/reviews"] });
      toast.success(`${v.ids.length > 1 ? `${v.ids.length} reviews` : "Review"} ${v.status}`);
    },
    onError: (e) => toastError(e),
  });

  const canUpdate = can("reviews.update");

  const columns = useMemo<ColumnDef<Review>[]>(
    () => [
      {
        id: "review",
        header: "Review",
        enableHiding: false,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="max-w-[420px] min-w-[260px] space-y-1 whitespace-normal">
              <div className="flex items-center gap-2">
                <Stars rating={r.rating} />
                {r.title && <span className="truncate font-medium">{r.title}</span>}
              </div>
              {r.body && <p className="text-muted-foreground line-clamp-2 text-sm">{r.body}</p>}
              <p className="text-muted-foreground text-xs">— {r.author_name}</p>
            </div>
          );
        },
      },
      {
        id: "product",
        header: "Product",
        cell: ({ row }) =>
          row.original.product ? (
            <Link to={`/products/${row.original.product.id}`} className="hover:underline">
              <span className="block max-w-[200px] truncate">{row.original.product.name}</span>
            </Link>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "rating",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Rating" />,
        cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.rating}/5</span>,
      },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        accessorKey: "created_at",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Date" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>,
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {canUpdate && r.status !== "approved" && (
                <Button size="sm" variant="outline" className="h-7" onClick={() => setStatus.mutate({ ids: [r.id], status: "approved" })}>
                  <TbCheck /> Approve
                </Button>
              )}
              <RowActions
                actions={[
                  { label: "Approve", icon: TbCheck, hidden: !canUpdate || r.status === "approved", onClick: () => setStatus.mutate({ ids: [r.id], status: "approved" }) },
                  { label: "Reject", icon: TbX, hidden: !canUpdate || r.status === "rejected", onClick: () => setStatus.mutate({ ids: [r.id], status: "rejected" }) },
                  { label: "Mark pending", hidden: !canUpdate || r.status === "pending", onClick: () => setStatus.mutate({ ids: [r.id], status: "pending" }) },
                  { label: "Delete", icon: TbTrash, destructive: true, separatorBefore: true, hidden: !can("reviews.delete"), onClick: () => confirm.ask(r) },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [can, canUpdate, confirm, setStatus],
  );

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Moderate product reviews before they appear in your store."
        breadcrumbs={[{ label: "Catalog" }, { label: "Reviews" }]}
      />
      <DataTable
        tableId="reviews"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search reviews…"
        enableSelection={canUpdate}
        bulkActions={(rows, clear) => (
          <>
            <Button size="sm" variant="outline" className="h-7" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ ids: rows.map((r) => r.id), status: "approved" }, { onSuccess: clear })}>
              <TbCheck /> Approve
            </Button>
            <Button size="sm" variant="outline" className="h-7" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ ids: rows.map((r) => r.id), status: "rejected" }, { onSuccess: clear })}>
              <TbX /> Reject
            </Button>
          </>
        )}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ],
          },
        ]}
        emptyTitle="No reviews"
        emptyDescription="Customer reviews will appear here for moderation."
      />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete review?"
        description={`The review by ${confirm.target?.author_name ?? ""} will be permanently removed.`}
        onConfirm={() => (confirm.target ? del.mutateAsync(confirm.target.id) : undefined)}
      />
    </>
  );
}
