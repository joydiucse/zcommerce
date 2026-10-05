import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import { TbArrowDown, TbArrowUp, TbCheck, TbEdit, TbPlus, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { BoolBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { FormDialog } from "@/components/forms/form-dialog";
import { MoneyField, NumberField, SwitchField, TextareaField, TextField } from "@/components/forms/fields";
import { usePermissions } from "@/hooks/use-auth";
import { useCreateMutation, useDeleteMutation, useListQuery, useUpdateMutation } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { applyApiErrors } from "@/lib/errors";
import { formatMoney, formatNumber } from "@/lib/format";
import { moveItem, slugify } from "@/lib/utils";
import type { Plan } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and dashes only"),
  description: z.string(),
  price_monthly: z.number().min(0),
  price_yearly: z.number().min(0),
  currency: z.string().trim().length(3, "3-letter ISO code"),
  limits: z.object({
    products: z.number().int().min(0),
    staff: z.number().int().min(0),
    storage_mb: z.number().int().min(0),
  }),
  features: z.array(z.string()),
  is_active: z.boolean(),
  sort_order: z.number().int(),
});
type Values = z.infer<typeof schema>;

const empty: Values = {
  name: "",
  slug: "",
  description: "",
  price_monthly: 0,
  price_yearly: 0,
  currency: "USD",
  limits: { products: 100, staff: 2, storage_mb: 1024 },
  features: [],
  is_active: true,
  sort_order: 0,
};

function FeaturesEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t) return;
    onChange([...value, t]);
    setText("");
  };
  return (
    <div className="space-y-2">
      {value.map((f, i) => (
        <div key={`${i}-${f}`} className="flex items-center gap-2">
          <TbCheck className="text-success size-4 shrink-0" />
          <Input value={f} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} className="h-8" />
          <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => onChange(moveItem(value, i, i - 1))} aria-label="Move up">
            <TbArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" disabled={i === value.length - 1} onClick={() => onChange(moveItem(value, i, i + 1))} aria-label="Move down">
            <TbArrowDown />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove">
            <TbTrash />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. Custom domain"
          className="h-8"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <TbPlus /> Add
        </Button>
      </div>
    </div>
  );
}

function PlanDialog({ open, onOpenChange, plan }: { open: boolean; onOpenChange: (o: boolean) => void; plan: Plan | null }) {
  const { can } = usePermissions();
  const create = useCreateMutation<Values>("/plans", { successMessage: "Plan created" });
  const update = useUpdateMutation<Values>("/plans", { successMessage: "Plan saved" });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const slugTouched = useRef(false);

  useEffect(() => {
    if (!open) return;
    slugTouched.current = !!plan;
    form.reset(
      plan
        ? {
            name: plan.name,
            slug: plan.slug,
            description: plan.description ?? "",
            price_monthly: Number(plan.price_monthly ?? 0),
            price_yearly: Number(plan.price_yearly ?? 0),
            currency: plan.currency ?? "USD",
            limits: {
              products: Number(plan.limits?.products ?? 0),
              staff: Number(plan.limits?.staff ?? 0),
              storage_mb: Number(plan.limits?.storage_mb ?? 0),
            },
            features: plan.features ?? [],
            is_active: plan.is_active,
            sort_order: plan.sort_order ?? 0,
          }
        : empty,
    );
  }, [open, plan, form]);

  const onSubmit = async (v: Values) => {
    const body = { ...v, slug: v.slug || slugify(v.name), currency: v.currency.toUpperCase(), features: v.features.map((f) => f.trim()).filter(Boolean) };
    try {
      if (plan) await update.mutateAsync({ id: plan.id, body });
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
      title={plan ? "Edit plan" : "New plan"}
      form={form}
      onSubmit={onSubmit}
      readOnly={plan ? !can("plans.update") : false}
      className="sm:max-w-2xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="name" label="Name" onValueChange={(v) => !slugTouched.current && form.setValue("slug", slugify(v))} />
        <TextField control={form.control} name="slug" label="Slug" onValueChange={() => (slugTouched.current = true)} />
      </div>
      <TextareaField control={form.control} name="description" label="Description" rows={2} />
      <div className="grid gap-4 sm:grid-cols-3">
        <MoneyField control={form.control} name="price_monthly" label="Monthly price" symbol="" />
        <MoneyField control={form.control} name="price_yearly" label="Yearly price" symbol="" />
        <TextField control={form.control} name="currency" label="Currency" onValueChange={(v) => form.setValue("currency", v.toUpperCase())} />
      </div>
      <div className="rounded-lg border p-4">
        <p className="mb-3 text-sm font-medium">Limits</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField control={form.control} name="limits.products" label="Products" min={0} />
          <NumberField control={form.control} name="limits.staff" label="Staff users" min={0} />
          <NumberField control={form.control} name="limits.storage_mb" label="Storage" min={0} suffix="MB" />
        </div>
      </div>
      <FormField
        control={form.control}
        name="features"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Features</FormLabel>
            <FeaturesEditor value={field.value} onChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SwitchField control={form.control} name="is_active" label="Active" description="Available for new subscriptions." />
        <NumberField control={form.control} name="sort_order" label="Sort order" />
      </div>
    </FormDialog>
  );
}

export function PlansPage() {
  const { can } = usePermissions();
  const state = useTableState({ defaultSort: "sort_order", defaultOrder: "asc" });
  const { data, isLoading, isFetching } = useListQuery<Plan>("/plans", state.params);
  const del = useDeleteMutation("/plans", { successMessage: "Plan deleted" });
  const confirm = useConfirmState<Plan>();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [open, setOpen] = useState(false);
  const edit = (p: Plan | null) => {
    setEditing(p);
    setOpen(true);
  };

  const columns = useMemo<ColumnDef<Plan>[]>(
    () => [
      {
        accessorKey: "name",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Plan" />,
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-muted-foreground max-w-[260px] truncate text-xs">{row.original.description || row.original.slug}</div>
          </div>
        ),
      },
      {
        accessorKey: "price_monthly",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Price" />,
        cell: ({ row }) => (
          <div className="tabular-nums">
            <div className="font-medium">{formatMoney(row.original.price_monthly, { currency: row.original.currency })}/mo</div>
            <div className="text-muted-foreground text-xs">{formatMoney(row.original.price_yearly, { currency: row.original.currency })}/yr</div>
          </div>
        ),
      },
      {
        id: "limits",
        header: "Limits",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {formatNumber(row.original.limits?.products)} products · {formatNumber(row.original.limits?.staff)} staff ·{" "}
            {formatNumber(row.original.limits?.storage_mb)} MB
          </span>
        ),
      },
      { id: "features", header: "Features", cell: ({ row }) => <span className="tabular-nums">{row.original.features?.length ?? 0}</span> },
      { accessorKey: "is_active", header: "Status", cell: ({ row }) => <BoolBadge value={row.original.is_active} /> },
      { accessorKey: "sort_order", enableSorting: true, header: ({ column }) => <ColumnHeader column={column} title="Order" /> },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <RowActions
            actions={[
              { label: can("plans.update") ? "Edit" : "View", icon: TbEdit, onClick: () => edit(row.original) },
              { label: "Delete", icon: TbTrash, destructive: true, hidden: !can("plans.delete"), onClick: () => confirm.ask(row.original) },
            ]}
          />
        ),
      },
    ],
    [can, confirm],
  );

  return (
    <>
      <PageHeader
        title="Plans"
        description="Subscription plans offered to merchants."
        breadcrumbs={[{ label: "Business" }, { label: "Plans" }]}
        actions={
          <Can perm="plans.create">
            <Button onClick={() => edit(null)}>
              <TbPlus /> New plan
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId="plans"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search plans…"
        onRowClick={edit}
        emptyTitle="No plans yet"
      />
      <PlanDialog open={open} onOpenChange={setOpen} plan={editing} />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete plan?"
        description={`"${confirm.target?.name ?? ""}" will be deleted. Existing subscriptions may block this.`}
        onConfirm={() => (confirm.target ? del.mutateAsync(confirm.target.id) : undefined)}
      />
    </>
  );
}
