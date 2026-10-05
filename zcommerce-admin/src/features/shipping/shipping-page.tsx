import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import { TbEdit, TbPlus, TbTrash, TbTruckDelivery } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { BoolBadge, StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { FormDialog } from "@/components/forms/form-dialog";
import { MoneyField, NumberField, SelectField, SwitchField, TextareaField, TextField } from "@/components/forms/fields";
import { usePermissions } from "@/hooks/use-auth";
import { useCreateMutation, useDeleteMutation, useListQuery, useUpdateMutation } from "@/hooks/use-resource";
import { useMoney } from "@/hooks/use-settings";
import { useTableState } from "@/hooks/use-table-state";
import { applyApiErrors } from "@/lib/errors";
import type { ShippingMethod } from "@/types";

const PATH = "/shipping/methods";

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string(),
    type: z.enum(["flat", "free", "free_over"]),
    rate: z.number().min(0),
    free_over_amount: z.number().min(0).nullable(),
    estimated_days: z.string(),
    is_active: z.boolean(),
    sort_order: z.number().int(),
  })
  .refine((v) => v.type !== "free_over" || (v.free_over_amount !== null && v.free_over_amount > 0), {
    path: ["free_over_amount"],
    message: "Set the order amount that unlocks free shipping",
  });
type Values = z.infer<typeof schema>;

const empty: Values = {
  name: "",
  description: "",
  type: "flat",
  rate: 0,
  free_over_amount: null,
  estimated_days: "",
  is_active: true,
  sort_order: 0,
};

const TYPE_LABEL: Record<string, string> = { flat: "Flat rate", free: "Free", free_over: "Free over amount" };

function ShippingDialog({ open, onOpenChange, method }: { open: boolean; onOpenChange: (o: boolean) => void; method: ShippingMethod | null }) {
  const { can } = usePermissions();
  const create = useCreateMutation<Values>(PATH, { successMessage: "Shipping method created" });
  const update = useUpdateMutation<Values>(PATH, { successMessage: "Shipping method saved" });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const type = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (!open) return;
    form.reset(
      method
        ? {
            name: method.name,
            description: method.description ?? "",
            type: method.type,
            rate: Number(method.rate ?? 0),
            free_over_amount: method.free_over_amount === null ? null : Number(method.free_over_amount),
            estimated_days: method.estimated_days ?? "",
            is_active: method.is_active,
            sort_order: method.sort_order ?? 0,
          }
        : empty,
    );
  }, [open, method, form]);

  const onSubmit = async (v: Values) => {
    const body: Values = { ...v, rate: v.type === "free" ? 0 : v.rate, free_over_amount: v.type === "free_over" ? v.free_over_amount : null };
    try {
      if (method) await update.mutateAsync({ id: method.id, body });
      else await create.mutateAsync(body);
      onOpenChange(false);
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={method ? "Edit shipping method" : "New shipping method"}
      form={form}
      onSubmit={onSubmit}
      readOnly={method ? !can("shipping.update") : false}
    >
      <TextField control={form.control} name="name" label="Name" placeholder="e.g. Standard shipping" />
      <TextareaField control={form.control} name="description" label="Description" rows={2} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          control={form.control}
          name="type"
          label="Type"
          options={[
            { value: "flat", label: "Flat rate" },
            { value: "free", label: "Free shipping" },
            { value: "free_over", label: "Free over an amount" },
          ]}
        />
        {type !== "free" && <MoneyField control={form.control} name="rate" label="Rate" />}
        {type === "free_over" && <MoneyField control={form.control} name="free_over_amount" label="Free when order is over" nullable />}
        <TextField control={form.control} name="estimated_days" label="Estimated delivery" placeholder="e.g. 3-5 business days" />
        <NumberField control={form.control} name="sort_order" label="Sort order" />
      </div>
      <SwitchField control={form.control} name="is_active" label="Active" description="Offer this method at checkout." />
    </FormDialog>
  );
}

export function ShippingPage() {
  const { can } = usePermissions();
  const money = useMoney();
  const state = useTableState({ defaultSort: "sort_order", defaultOrder: "asc" });
  const { data, isLoading, isFetching } = useListQuery<ShippingMethod>(PATH, state.params);
  const del = useDeleteMutation(PATH, { successMessage: "Shipping method deleted" });
  const confirm = useConfirmState<ShippingMethod>();
  const [editing, setEditing] = useState<ShippingMethod | null>(null);
  const [open, setOpen] = useState(false);
  const edit = (m: ShippingMethod | null) => {
    setEditing(m);
    setOpen(true);
  };

  const columns = useMemo<ColumnDef<ShippingMethod>[]>(
    () => [
      {
        accessorKey: "name",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Method" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
              <TbTruckDelivery className="size-5" />
            </div>
            <div>
              <div className="font-medium">{row.original.name}</div>
              {row.original.description && <div className="text-muted-foreground max-w-[280px] truncate text-xs">{row.original.description}</div>}
            </div>
          </div>
        ),
      },
      { accessorKey: "type", header: "Type", cell: ({ row }) => <StatusBadge status={row.original.type} label={TYPE_LABEL[row.original.type]} variant="secondary" dot={false} /> },
      {
        accessorKey: "rate",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Rate" />,
        cell: ({ row }) => {
          const m = row.original;
          if (m.type === "free") return <span className="text-success font-medium">Free</span>;
          return (
            <div className="tabular-nums">
              <span className="font-medium">{money.format(m.rate)}</span>
              {m.type === "free_over" && m.free_over_amount !== null && (
                <div className="text-muted-foreground text-xs">Free over {money.format(m.free_over_amount)}</div>
              )}
            </div>
          );
        },
      },
      { accessorKey: "estimated_days", header: "Delivery", cell: ({ row }) => row.original.estimated_days || "—" },
      { accessorKey: "is_active", header: "Status", cell: ({ row }) => <BoolBadge value={row.original.is_active} /> },
      { accessorKey: "sort_order", enableSorting: true, header: ({ column }) => <ColumnHeader column={column} title="Order" /> },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <RowActions
            actions={[
              { label: can("shipping.update") ? "Edit" : "View", icon: TbEdit, onClick: () => edit(row.original) },
              { label: "Delete", icon: TbTrash, destructive: true, hidden: !can("shipping.delete"), onClick: () => confirm.ask(row.original) },
            ]}
          />
        ),
      },
    ],
    [can, confirm, money],
  );

  return (
    <>
      <PageHeader
        title="Shipping methods"
        description="Delivery options offered to shoppers at checkout."
        breadcrumbs={[{ label: "Store" }, { label: "Shipping" }]}
        actions={
          <Can perm="shipping.create">
            <Button onClick={() => edit(null)}>
              <TbPlus /> Add method
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId="shipping"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search methods…"
        onRowClick={edit}
        emptyTitle="No shipping methods"
        emptyDescription="Add at least one method so customers can check out."
      />
      <ShippingDialog open={open} onOpenChange={setOpen} method={editing} />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete shipping method?"
        description={`"${confirm.target?.name ?? ""}" will no longer be offered at checkout.`}
        onConfirm={() => (confirm.target ? del.mutateAsync(confirm.target.id) : undefined)}
      />
    </>
  );
}
