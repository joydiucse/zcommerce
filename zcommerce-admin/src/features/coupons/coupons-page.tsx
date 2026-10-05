import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { TbCopy, TbEdit, TbPlus, TbTicket, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { FormDialog } from "@/components/forms/form-dialog";
import { MoneyField, NumberField, SelectField, SwitchField, TextField } from "@/components/forms/fields";
import { usePermissions } from "@/hooks/use-auth";
import { useCreateMutation, useDeleteMutation, useListQuery, useUpdateMutation } from "@/hooks/use-resource";
import { useMoney } from "@/hooks/use-settings";
import { useTableState } from "@/hooks/use-table-state";
import { applyApiErrors } from "@/lib/errors";
import { formatDate, fromDateTimeLocal, toDateTimeLocal } from "@/lib/format";
import type { Coupon } from "@/types";

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "At least 2 characters")
      .max(50)
      .regex(/^[A-Z0-9_-]+$/, "Uppercase letters, numbers, dashes and underscores only"),
    type: z.enum(["percent", "fixed", "free_shipping"]),
    value: z.number().min(0),
    min_order_amount: z.number().min(0).nullable(),
    max_discount: z.number().min(0).nullable(),
    usage_limit: z.number().int().min(1).nullable(),
    starts_at: z.string(),
    ends_at: z.string(),
    is_active: z.boolean(),
  })
  .refine((v) => v.type !== "percent" || (v.value > 0 && v.value <= 100), { path: ["value"], message: "Percent must be between 1 and 100" })
  .refine((v) => v.type !== "fixed" || v.value > 0, { path: ["value"], message: "Amount must be greater than 0" })
  .refine((v) => !v.starts_at || !v.ends_at || new Date(v.ends_at) > new Date(v.starts_at), { path: ["ends_at"], message: "End must be after start" });
type Values = z.infer<typeof schema>;

const empty: Values = {
  code: "",
  type: "percent",
  value: 10,
  min_order_amount: null,
  max_discount: null,
  usage_limit: null,
  starts_at: "",
  ends_at: "",
  is_active: true,
};

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function couponState(c: Coupon): string {
  const now = Date.now();
  if (!c.is_active) return "disabled";
  if (c.ends_at && new Date(c.ends_at).getTime() < now) return "expired";
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return "scheduled";
  if (c.usage_limit !== null && c.used_count >= c.usage_limit) return "used_up";
  return "active";
}

function CouponDialog({ open, onOpenChange, coupon }: { open: boolean; onOpenChange: (o: boolean) => void; coupon: Coupon | null }) {
  const { can } = usePermissions();
  const create = useCreateMutation<Record<string, unknown>>("/coupons", { successMessage: "Coupon created" });
  const update = useUpdateMutation<Record<string, unknown>>("/coupons", { successMessage: "Coupon saved" });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const type = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (!open) return;
    form.reset(
      coupon
        ? {
            code: coupon.code,
            type: coupon.type,
            value: Number(coupon.value ?? 0),
            min_order_amount: coupon.min_order_amount === null ? null : Number(coupon.min_order_amount),
            max_discount: coupon.max_discount === null ? null : Number(coupon.max_discount),
            usage_limit: coupon.usage_limit,
            starts_at: toDateTimeLocal(coupon.starts_at),
            ends_at: toDateTimeLocal(coupon.ends_at),
            is_active: coupon.is_active,
          }
        : { ...empty, code: randomCode() },
    );
  }, [open, coupon, form]);

  const onSubmit = async (v: Values) => {
    const body = {
      ...v,
      value: v.type === "free_shipping" ? 0 : v.value,
      max_discount: v.type === "percent" ? v.max_discount : null,
      starts_at: fromDateTimeLocal(v.starts_at),
      ends_at: fromDateTimeLocal(v.ends_at),
    };
    try {
      if (coupon) await update.mutateAsync({ id: coupon.id, body });
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
      title={coupon ? "Edit coupon" : "New coupon"}
      form={form}
      onSubmit={onSubmit}
      readOnly={coupon ? !can("coupons.update") : false}
    >
      <div className="flex items-end gap-2">
        <TextField
          control={form.control}
          name="code"
          label="Code"
          className="flex-1"
          onValueChange={(v) => form.setValue("code", v.toUpperCase().replace(/\s/g, ""))}
        />
        <Button type="button" variant="outline" onClick={() => form.setValue("code", randomCode(), { shouldValidate: true })}>
          Generate
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          control={form.control}
          name="type"
          label="Discount type"
          options={[
            { value: "percent", label: "Percentage" },
            { value: "fixed", label: "Fixed amount" },
            { value: "free_shipping", label: "Free shipping" },
          ]}
        />
        {type === "percent" && <NumberField control={form.control} name="value" label="Percent off" suffix="%" min={1} max={100} />}
        {type === "fixed" && <MoneyField control={form.control} name="value" label="Amount off" />}
        <MoneyField control={form.control} name="min_order_amount" label="Minimum order" nullable placeholder="No minimum" />
        {type === "percent" && <MoneyField control={form.control} name="max_discount" label="Maximum discount" nullable placeholder="No cap" />}
        <NumberField control={form.control} name="usage_limit" label="Usage limit" nullable min={1} placeholder="Unlimited" />
        <TextField control={form.control} name="starts_at" label="Starts" type="datetime-local" />
        <TextField control={form.control} name="ends_at" label="Ends" type="datetime-local" />
      </div>
      <SwitchField control={form.control} name="is_active" label="Active" />
    </FormDialog>
  );
}

export function CouponsPage() {
  const { can } = usePermissions();
  const money = useMoney();
  const state = useTableState({ filterKeys: ["is_active", "type"] });
  const { data, isLoading, isFetching } = useListQuery<Coupon>("/coupons", state.params);
  const del = useDeleteMutation("/coupons", { successMessage: "Coupon deleted" });
  const confirm = useConfirmState<Coupon>();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [open, setOpen] = useState(false);
  const edit = (c: Coupon | null) => {
    setEditing(c);
    setOpen(true);
  };

  const columns = useMemo<ColumnDef<Coupon>[]>(
    () => [
      {
        accessorKey: "code",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Code" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <TbTicket className="text-primary size-4" />
            <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wide">{row.original.code}</span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                void navigator.clipboard?.writeText(row.original.code);
                toast.success("Code copied");
              }}
              aria-label="Copy code"
            >
              <TbCopy className="size-3.5" />
            </button>
          </div>
        ),
      },
      {
        id: "discount",
        header: "Discount",
        cell: ({ row }) => {
          const c = row.original;
          const label = c.type === "percent" ? `${Number(c.value)}% off` : c.type === "fixed" ? `${money.format(c.value)} off` : "Free shipping";
          return (
            <div>
              <div className="font-medium">{label}</div>
              {c.min_order_amount ? <div className="text-muted-foreground text-xs">Min. {money.format(c.min_order_amount)}</div> : null}
            </div>
          );
        },
      },
      {
        accessorKey: "used_count",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Usage" />,
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.used_count}
            <span className="text-muted-foreground"> / {row.original.usage_limit ?? "∞"}</span>
          </span>
        ),
      },
      {
        id: "period",
        header: "Active period",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.starts_at ? formatDate(row.original.starts_at) : "Now"} → {row.original.ends_at ? formatDate(row.original.ends_at) : "No end"}
          </span>
        ),
      },
      {
        id: "state",
        header: "Status",
        cell: ({ row }) => {
          const s = couponState(row.original);
          const variant = s === "active" ? "success" : s === "scheduled" ? "info" : s === "expired" || s === "used_up" ? "warning" : "muted";
          return <StatusBadge status={s} variant={variant} />;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <RowActions
            actions={[
              { label: can("coupons.update") ? "Edit" : "View", icon: TbEdit, onClick: () => edit(row.original) },
              { label: "Delete", icon: TbTrash, destructive: true, hidden: !can("coupons.delete"), onClick: () => confirm.ask(row.original) },
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
        title="Coupons"
        description="Discount codes customers can apply at checkout."
        breadcrumbs={[{ label: "Sales" }, { label: "Coupons" }]}
        actions={
          <Can perm="coupons.create">
            <Button onClick={() => edit(null)}>
              <TbPlus /> Create coupon
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId="coupons"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search codes…"
        filters={[
          {
            key: "type",
            label: "Type",
            options: [
              { value: "percent", label: "Percentage" },
              { value: "fixed", label: "Fixed amount" },
              { value: "free_shipping", label: "Free shipping" },
            ],
          },
          {
            key: "is_active",
            label: "Status",
            options: [
              { value: "true", label: "Active" },
              { value: "false", label: "Disabled" },
            ],
          },
        ]}
        onRowClick={edit}
        emptyTitle="No coupons yet"
      />
      <CouponDialog open={open} onOpenChange={setOpen} coupon={editing} />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete coupon?"
        description={`Code ${confirm.target?.code ?? ""} will stop working immediately.`}
        onConfirm={() => (confirm.target ? del.mutateAsync(confirm.target.id) : undefined)}
      />
    </>
  );
}
