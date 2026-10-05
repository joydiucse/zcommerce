import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TbArchive, TbCheck, TbEdit, TbExternalLink, TbPhoto, TbPlus, TbStarFilled, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { Can } from "@/components/common/can";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { useBrandOptions, useCategoryOptions } from "@/features/catalog-options";
import { usePermissions } from "@/hooks/use-auth";
import { useDeleteMutation, useListQuery } from "@/hooks/use-resource";
import { useMoney } from "@/hooks/use-settings";
import { useTableState } from "@/hooks/use-table-state";
import { apiPost } from "@/lib/api";
import { STORE_URL } from "@/lib/env";
import { toastError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

type BulkAction = "delete" | "activate" | "archive";

export function stockState(p: Pick<Product, "track_inventory" | "stock_quantity" | "low_stock_threshold">) {
  if (!p.track_inventory) return "untracked";
  if (p.stock_quantity <= 0) return "out";
  if (p.stock_quantity <= p.low_stock_threshold) return "low";
  return "in";
}

export function StockCell({ p }: { p: Pick<Product, "track_inventory" | "stock_quantity" | "low_stock_threshold"> }) {
  const s = stockState(p);
  if (s === "untracked") return <span className="text-muted-foreground text-xs">Not tracked</span>;
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "size-2 rounded-full",
          s === "out" ? "bg-destructive" : s === "low" ? "bg-warning" : "bg-success",
        )}
      />
      <span className={cn("tabular-nums", s === "out" && "text-destructive font-medium")}>{p.stock_quantity}</span>
      {s !== "in" && <span className="text-muted-foreground text-xs">{s === "out" ? "Out of stock" : "Low"}</span>}
    </div>
  );
}

export function ProductsPage() {
  const navigate = useNavigate();
  const money = useMoney();
  const { can } = usePermissions();
  const qc = useQueryClient();
  const state = useTableState({ filterKeys: ["status", "category_id", "brand_id", "stock", "is_featured"] });
  const { data, isLoading, isFetching } = useListQuery<Product>("/products", state.params);
  const categories = useCategoryOptions();
  const brands = useBrandOptions();
  const del = useDeleteMutation("/products", { successMessage: "Product deleted", invalidate: ["/inventory"] });
  const confirm = useConfirmState<Product>();
  const [bulkConfirm, setBulkConfirm] = useState<{ ids: string[]; clear: () => void } | null>(null);

  const bulk = useMutation({
    mutationFn: (vars: { ids: string[]; action: BulkAction }) => apiPost("tenant", "/products/bulk", vars),
    onSuccess: (_d, vars) => {
      toast.success(`${vars.ids.length} product(s) ${vars.action === "delete" ? "deleted" : vars.action === "activate" ? "activated" : "archived"}`);
      return qc.invalidateQueries({ queryKey: ["tenant", "/products"] });
    },
    onError: (e) => toastError(e),
  });

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        meta: { label: "Product" },
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Product" />,
        cell: ({ row }) => {
          const p = row.original;
          const img = p.images?.[0]?.url;
          return (
            <div className="flex min-w-[220px] items-center gap-3">
              <div className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                {img ? <img src={img} alt="" className="size-full object-cover" loading="lazy" /> : <TbPhoto className="text-muted-foreground" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="max-w-[260px] truncate font-medium">{p.name}</span>
                  {p.is_featured && <TbStarFilled className="size-3.5 shrink-0 text-amber-500" title="Featured" />}
                </div>
                <div className="text-muted-foreground text-xs">{p.sku || "No SKU"}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Status" />,
        enableSorting: true,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "stock_quantity",
        meta: { label: "Stock" },
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Stock" />,
        cell: ({ row }) => <StockCell p={row.original} />,
      },
      {
        accessorKey: "price",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Price" />,
        cell: ({ row }) => (
          <div className="tabular-nums">
            <span className="font-medium">{money.format(row.original.price)}</span>
            {row.original.compare_at_price ? (
              <span className="text-muted-foreground ml-1.5 text-xs line-through">{money.format(row.original.compare_at_price)}</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => row.original.category?.name ?? <span className="text-muted-foreground">—</span>,
      },
      {
        id: "brand",
        header: "Brand",
        cell: ({ row }) => row.original.brand?.name ?? <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: "created_at",
        meta: { label: "Created" },
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Created" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>,
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <RowActions
            actions={[
              { label: can("products.update") ? "Edit" : "View", icon: TbEdit, onClick: () => navigate(`/products/${row.original.id}`) },
              {
                label: "View in store",
                icon: TbExternalLink,
                onClick: () => window.open(`${STORE_URL}/products/${row.original.slug}`, "_blank"),
              },
              {
                label: "Delete",
                icon: TbTrash,
                destructive: true,
                separatorBefore: true,
                hidden: !can("products.delete"),
                onClick: () => confirm.ask(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [money, can, navigate, confirm],
  );

  const canBulk = can(["products.update", "products.delete"]);

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your catalog, pricing and visibility."
        breadcrumbs={[{ label: "Catalog" }, { label: "Products" }]}
        actions={
          <Can perm="products.create">
            <Button asChild>
              <Link to="/products/new">
                <TbPlus /> Add product
              </Link>
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId="products"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search name or SKU…"
        onRowClick={(p) => navigate(`/products/${p.id}`)}
        enableSelection={canBulk}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
              { value: "archived", label: "Archived" },
            ],
          },
          { key: "category_id", label: "Category", options: categories.options },
          { key: "brand_id", label: "Brand", options: brands.options },
          {
            key: "stock",
            label: "Stock",
            options: [
              { value: "in", label: "In stock" },
              { value: "low", label: "Low stock" },
              { value: "out", label: "Out of stock" },
            ],
          },
          {
            key: "is_featured",
            label: "Featured",
            options: [
              { value: "true", label: "Featured" },
              { value: "false", label: "Not featured" },
            ],
          },
        ]}
        bulkActions={(rows, clear) => {
          const ids = rows.map((r) => r.id);
          return (
            <>
              {can("products.update") && (
                <>
                  <Button size="sm" variant="outline" className="h-7" disabled={bulk.isPending} onClick={() => bulk.mutate({ ids, action: "activate" }, { onSuccess: clear })}>
                    <TbCheck /> Activate
                  </Button>
                  <Button size="sm" variant="outline" className="h-7" disabled={bulk.isPending} onClick={() => bulk.mutate({ ids, action: "archive" }, { onSuccess: clear })}>
                    <TbArchive /> Archive
                  </Button>
                </>
              )}
              {can("products.delete") && (
                <Button size="sm" variant="destructive" className="h-7" disabled={bulk.isPending} onClick={() => setBulkConfirm({ ids, clear })}>
                  <TbTrash /> Delete
                </Button>
              )}
            </>
          );
        }}
        emptyTitle="No products yet"
        emptyDescription="Add your first product to start selling."
        emptyAction={
          can("products.create") ? (
            <Button asChild size="sm">
              <Link to="/products/new">
                <TbPlus /> Add product
              </Link>
            </Button>
          ) : undefined
        }
      />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete product?"
        description={`"${confirm.target?.name ?? ""}" will be permanently removed.`}
        onConfirm={() => (confirm.target ? del.mutateAsync(confirm.target.id) : undefined)}
      />
      <ConfirmDialog
        open={!!bulkConfirm}
        onOpenChange={(o) => !o && setBulkConfirm(null)}
        title={`Delete ${bulkConfirm?.ids.length ?? 0} products?`}
        description="The selected products will be permanently removed."
        onConfirm={async () => {
          if (!bulkConfirm) return;
          await bulk.mutateAsync({ ids: bulkConfirm.ids, action: "delete" });
          bulkConfirm.clear();
        }}
      />
    </>
  );
}
