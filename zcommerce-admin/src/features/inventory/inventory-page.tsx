import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { TbAdjustments, TbHistory, TbPhoto, TbX } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { FormDialog } from "@/components/forms/form-dialog";
import { NumberField, SelectField, TextField } from "@/components/forms/fields";
import { StockCell } from "@/features/products/products-page";
import { usePermissions } from "@/hooks/use-auth";
import { useListQuery } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { apiPost } from "@/lib/api";
import { applyApiErrors } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InventoryMovement, Product } from "@/types";

const adjustSchema = z.object({
  type: z.enum(["adjustment", "restock", "return", "sale"]),
  quantity: z.number().int("Whole numbers only").refine((v) => v !== 0, "Quantity cannot be 0"),
  reason: z.string().trim().min(1, "Please give a reason").max(255),
});
type AdjustValues = z.infer<typeof adjustSchema>;

function AdjustDialog({ product, onOpenChange }: { product: Product | null; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const form = useForm<AdjustValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { type: "restock", quantity: 1, reason: "" },
  });
  useEffect(() => {
    if (product) form.reset({ type: "restock", quantity: 1, reason: "" });
  }, [product, form]);

  const [qty, type] = useWatch({ control: form.control, name: ["quantity", "type"] });
  const adjust = useMutation({
    mutationFn: (body: AdjustValues & { product_id: string }) => apiPost("tenant", "/inventory/adjust", body),
  });

  const onSubmit = async (v: AdjustValues) => {
    if (!product) return;
    try {
      await adjust.mutateAsync({ ...v, product_id: product.id });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["tenant", "/inventory"] }),
        qc.invalidateQueries({ queryKey: ["tenant", "/inventory/movements"] }),
        qc.invalidateQueries({ queryKey: ["tenant", "/products"] }),
        qc.invalidateQueries({ queryKey: ["tenant", "/dashboard"] }),
      ]);
      toast.success("Stock adjusted");
      onOpenChange(false);
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  const current = product?.stock_quantity ?? 0;
  const next = current + (Number.isFinite(qty) ? qty : 0);

  return (
    <FormDialog
      open={!!product}
      onOpenChange={onOpenChange}
      title="Adjust stock"
      description={product ? `${product.name}${product.sku ? ` · ${product.sku}` : ""}` : undefined}
      form={form}
      onSubmit={onSubmit}
      submitText="Apply adjustment"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          control={form.control}
          name="type"
          label="Type"
          options={[
            { value: "restock", label: "Restock (+)" },
            { value: "return", label: "Return (+)" },
            { value: "adjustment", label: "Adjustment (±)" },
            { value: "sale", label: "Manual sale (−)" },
          ]}
        />
        <NumberField
          control={form.control}
          name="quantity"
          label="Quantity change"
          description="Use a negative number to remove stock."
        />
      </div>
      <TextField control={form.control} name="reason" label="Reason" placeholder={type === "restock" ? "e.g. New shipment from supplier" : "e.g. Damaged items"} />
      <div className="bg-muted/50 flex items-center justify-around rounded-lg p-3 text-center text-sm">
        <div>
          <div className="text-muted-foreground text-xs">Current</div>
          <div className="text-lg font-semibold tabular-nums">{current}</div>
        </div>
        <div className="text-muted-foreground">→</div>
        <div>
          <div className="text-muted-foreground text-xs">After</div>
          <div className={cn("text-lg font-semibold tabular-nums", next < 0 && "text-destructive")}>{next}</div>
        </div>
      </div>
    </FormDialog>
  );
}

function StockTab({ onHistory }: { onHistory: (p: Product) => void }) {
  const { can } = usePermissions();
  const state = useTableState({ defaultSort: "stock_quantity", defaultOrder: "asc", filterKeys: ["stock"] });
  const { data, isLoading, isFetching } = useListQuery<Product>("/inventory", state.params);
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Product" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="bg-muted flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border">
              {row.original.images?.[0]?.url ? (
                <img src={row.original.images[0].url} alt="" className="size-full object-cover" loading="lazy" />
              ) : (
                <TbPhoto className="text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <div className="max-w-[260px] truncate font-medium">{row.original.name}</div>
              <div className="text-muted-foreground text-xs">{row.original.sku || "No SKU"}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "stock_quantity",
        meta: { label: "On hand" },
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="On hand" />,
        cell: ({ row }) => <StockCell p={row.original} />,
      },
      {
        accessorKey: "low_stock_threshold",
        meta: { label: "Threshold" },
        header: "Threshold",
        cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.original.low_stock_threshold}</span>,
      },
      { accessorKey: "status", header: "Product status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={() => onHistory(row.original)}>
              <TbHistory /> History
            </Button>
            {can("inventory.update") && (
              <Button variant="outline" size="sm" onClick={() => setAdjusting(row.original)}>
                <TbAdjustments /> Adjust
              </Button>
            )}
          </div>
        ),
      },
    ],
    [can, onHistory],
  );

  return (
    <>
      <DataTable
        tableId="inventory"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search product or SKU…"
        filters={[
          {
            key: "stock",
            label: "Stock",
            options: [
              { value: "in", label: "In stock" },
              { value: "low", label: "Low stock" },
              { value: "out", label: "Out of stock" },
            ],
          },
        ]}
        emptyTitle="No products to show"
      />
      <AdjustDialog product={adjusting} onOpenChange={(o) => !o && setAdjusting(null)} />
    </>
  );
}

function MovementsTab({ productName, onClearProduct }: { productName?: string; onClearProduct: () => void }) {
  const state = useTableState({ prefix: "m_", filterKeys: ["product_id", "type"] });
  const { data, isLoading, isFetching } = useListQuery<InventoryMovement>("/inventory/movements", state.params);

  const columns = useMemo<ColumnDef<InventoryMovement>[]>(
    () => [
      {
        accessorKey: "created_at",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Date" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.created_at)}</span>,
      },
      {
        id: "product",
        header: "Product",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.product?.name ?? "—"}</div>
            {row.original.product?.sku && <div className="text-muted-foreground text-xs">{row.original.product.sku}</div>}
          </div>
        ),
      },
      { accessorKey: "type", header: "Type", cell: ({ row }) => <StatusBadge status={row.original.type} /> },
      {
        accessorKey: "quantity",
        header: "Change",
        cell: ({ row }) => (
          <span className={cn("font-semibold tabular-nums", row.original.quantity > 0 ? "text-success" : "text-destructive")}>
            {row.original.quantity > 0 ? `+${row.original.quantity}` : row.original.quantity}
          </span>
        ),
      },
      { accessorKey: "reason", header: "Reason", cell: ({ row }) => <span className="block max-w-[260px] truncate">{row.original.reason || "—"}</span> },
      { accessorKey: "reference", header: "Reference", cell: ({ row }) => <span className="font-mono text-xs">{row.original.reference || "—"}</span> },
      { id: "by", header: "By", cell: ({ row }) => row.original.created_by_name ?? row.original.created_by_user?.name ?? <span className="text-muted-foreground">System</span> },
    ],
    [],
  );

  return (
    <DataTable
      tableId="movements"
      columns={columns}
      data={data?.data}
      meta={data?.meta}
      isLoading={isLoading}
      isFetching={isFetching}
      state={state}
      hideSearch
      filters={[
        {
          key: "type",
          label: "Type",
          options: [
            { value: "adjustment", label: "Adjustment" },
            { value: "sale", label: "Sale" },
            { value: "return", label: "Return" },
            { value: "restock", label: "Restock" },
          ],
        },
      ]}
      toolbarExtra={
        state.filters.product_id ? (
          <Badge variant="secondary" className="h-8 gap-1.5 px-2.5 text-xs">
            Product: {productName ?? "selected"}
            <button
              type="button"
              onClick={() => {
                state.setFilter("product_id", undefined);
                onClearProduct();
              }}
              className="hover:text-destructive"
            >
              <TbX className="size-3.5" />
            </button>
          </Badge>
        ) : null
      }
      emptyTitle="No stock movements"
    />
  );
}

export function InventoryPage() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") === "movements" ? "movements" : "stock";
  const [productName, setProductName] = useState<string | undefined>();

  const setTab = (t: string, extra?: Record<string, string>) => {
    setSp(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (t === "stock") next.delete("tab");
        else next.set("tab", t);
        for (const [k, v] of Object.entries(extra ?? {})) next.set(k, v);
        return next;
      },
      { replace: true },
    );
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Monitor stock levels and record adjustments."
        breadcrumbs={[{ label: "Catalog" }, { label: "Inventory" }]}
      />
      <Tabs value={tab} onValueChange={(t) => setTab(t)} className="gap-4">
        <TabsList>
          <TabsTrigger value="stock">Stock levels</TabsTrigger>
          <TabsTrigger value="movements">Movements history</TabsTrigger>
        </TabsList>
        <TabsContent value="stock">
          <StockTab
            onHistory={(p) => {
              setProductName(p.name);
              setTab("movements", { m_product_id: p.id });
            }}
          />
        </TabsContent>
        <TabsContent value="movements">
          <MovementsTab productName={productName} onClearProduct={() => setProductName(undefined)} />
        </TabsContent>
      </Tabs>
    </>
  );
}
