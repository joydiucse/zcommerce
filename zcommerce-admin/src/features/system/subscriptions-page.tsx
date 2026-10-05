import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import { TbBan, TbEdit, TbPlus } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { FormDialog } from "@/components/forms/form-dialog";
import { MoneyField, SelectField, TextField } from "@/components/forms/fields";
import { usePermissions } from "@/hooks/use-auth";
import { useActionMutation, useAllQuery, useCreateMutation, useListQuery, useUpdateMutation } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { applyApiErrors } from "@/lib/errors";
import { formatDate, formatMoney, toISODate } from "@/lib/format";
import type { Plan, Subscription, Tenant } from "@/types";

const STATUS_OPTIONS = [
  { value: "trialing", label: "Trialing" },
  { value: "active", label: "Active" },
  { value: "past_due", label: "Past due" },
  { value: "canceled", label: "Canceled" },
];

const schema = z.object({
  tenant_id: z.string().nullable().refine((v) => !!v, "Select a tenant"),
  plan_id: z.string().nullable().refine((v) => !!v, "Select a plan"),
  status: z.enum(["trialing", "active", "past_due", "canceled"]),
  billing_cycle: z.enum(["monthly", "yearly"]),
  amount: z.number().min(0),
  current_period_start: z.string(),
  current_period_end: z.string(),
});
type Values = z.infer<typeof schema>;

function addPeriod(start: string, cycle: "monthly" | "yearly") {
  const d = start ? new Date(start) : new Date();
  if (cycle === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return toISODate(d);
}

function SubscriptionDialog({ open, onOpenChange, sub }: { open: boolean; onOpenChange: (o: boolean) => void; sub: Subscription | null }) {
  const tenants = useAllQuery<Tenant>("/tenants", {}, open);
  const plans = useAllQuery<Plan>("/plans", {}, open);
  const create = useCreateMutation<Record<string, unknown>>("/subscriptions", { successMessage: "Subscription created", invalidate: ["/dashboard", "/tenants"] });
  const update = useUpdateMutation<Record<string, unknown>>("/subscriptions", { successMessage: "Subscription saved", invalidate: ["/dashboard", "/tenants"] });
  const today = toISODate(new Date());
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { tenant_id: null, plan_id: null, status: "active", billing_cycle: "monthly", amount: 0, current_period_start: today, current_period_end: addPeriod(today, "monthly") },
  });
  const [planId, cycle, start] = useWatch({ control: form.control, name: ["plan_id", "billing_cycle", "current_period_start"] });

  useEffect(() => {
    if (!open) return;
    form.reset(
      sub
        ? {
            tenant_id: sub.tenant_id,
            plan_id: sub.plan_id,
            status: sub.status,
            billing_cycle: sub.billing_cycle,
            amount: Number(sub.amount ?? 0),
            current_period_start: sub.current_period_start?.slice(0, 10) ?? "",
            current_period_end: sub.current_period_end?.slice(0, 10) ?? "",
          }
        : { tenant_id: null, plan_id: null, status: "active", billing_cycle: "monthly", amount: 0, current_period_start: today, current_period_end: addPeriod(today, "monthly") },
    );
  }, [open, sub, form, today]);

  // Auto-fill amount / period end from the plan when the user changes plan or cycle.
  useEffect(() => {
    const p = plans.data?.find((x) => x.id === planId);
    if (p && (form.formState.dirtyFields.plan_id || form.formState.dirtyFields.billing_cycle)) {
      form.setValue("amount", Number(cycle === "yearly" ? p.price_yearly : p.price_monthly), { shouldDirty: true });
    }
    if (form.formState.dirtyFields.billing_cycle || form.formState.dirtyFields.current_period_start) {
      form.setValue("current_period_end", addPeriod(start, cycle), { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, cycle, start, plans.data]);

  const onSubmit = async (v: Values) => {
    const body = {
      ...v,
      current_period_start: v.current_period_start ? new Date(v.current_period_start).toISOString() : null,
      current_period_end: v.current_period_end ? new Date(v.current_period_end).toISOString() : null,
    };
    try {
      if (sub) {
        const { tenant_id: _omit, ...rest } = body;
        void _omit;
        await update.mutateAsync({ id: sub.id, body: rest });
      } else await create.mutateAsync(body);
      onOpenChange(false);
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={sub ? "Edit subscription" : "New subscription"} form={form} onSubmit={onSubmit}>
      <SelectField
        control={form.control}
        name="tenant_id"
        label="Tenant"
        disabled={!!sub}
        placeholder={tenants.isLoading ? "Loading…" : "Select tenant"}
        options={(tenants.data ?? []).map((t) => ({ value: t.id, label: `${t.name} (${t.slug})` }))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          control={form.control}
          name="plan_id"
          label="Plan"
          placeholder={plans.isLoading ? "Loading…" : "Select plan"}
          options={(plans.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
        />
        <SelectField
          control={form.control}
          name="billing_cycle"
          label="Billing cycle"
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
          ]}
        />
        <MoneyField control={form.control} name="amount" label="Amount" symbol="$" />
        <SelectField control={form.control} name="status" label="Status" options={STATUS_OPTIONS} />
        <TextField control={form.control} name="current_period_start" label="Period start" type="date" />
        <TextField control={form.control} name="current_period_end" label="Period end" type="date" />
      </div>
    </FormDialog>
  );
}

export function SubscriptionsPage() {
  const { can } = usePermissions();
  const state = useTableState({ filterKeys: ["status", "tenant_id"] });
  const { data, isLoading, isFetching } = useListQuery<Subscription>("/subscriptions", state.params);
  const tenants = useAllQuery<Tenant>("/tenants");
  const confirm = useConfirmState<Subscription>();
  const cancel = useActionMutation<string>((id) => ({ path: `/subscriptions/${id}/cancel` }), {
    resourcePath: "/subscriptions",
    successMessage: "Subscription canceled",
    invalidate: ["/dashboard"],
  });
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [open, setOpen] = useState(false);
  const edit = (s: Subscription | null) => {
    setEditing(s);
    setOpen(true);
  };
  const tenantName = useMemo(() => new Map((tenants.data ?? []).map((t) => [t.id, t.name])), [tenants.data]);

  const columns = useMemo<ColumnDef<Subscription>[]>(
    () => [
      {
        id: "tenant",
        header: "Tenant",
        enableHiding: false,
        cell: ({ row }) => <span className="font-medium">{row.original.tenant?.name ?? tenantName.get(row.original.tenant_id) ?? row.original.tenant_id.slice(0, 8)}</span>,
      },
      { id: "plan", header: "Plan", cell: ({ row }) => row.original.plan?.name ?? "—" },
      {
        accessorKey: "status",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      { accessorKey: "billing_cycle", header: "Cycle", cell: ({ row }) => <span className="capitalize">{row.original.billing_cycle}</span> },
      {
        accessorKey: "amount",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => <span className="font-medium tabular-nums">{formatMoney(row.original.amount)}</span>,
      },
      {
        id: "period",
        header: "Current period",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {formatDate(row.original.current_period_start)} → {formatDate(row.original.current_period_end)}
          </span>
        ),
      },
      {
        accessorKey: "canceled_at",
        meta: { label: "Canceled" },
        header: "Canceled",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.canceled_at ? formatDate(row.original.canceled_at) : "—"}</span>,
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <RowActions
            actions={[
              { label: "Edit", icon: TbEdit, hidden: !can("subscriptions.update"), onClick: () => edit(row.original) },
              {
                label: "Cancel subscription",
                icon: TbBan,
                destructive: true,
                hidden: !can("subscriptions.update") || row.original.status === "canceled",
                onClick: () => confirm.ask(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [can, confirm, tenantName],
  );

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Plan subscriptions for every tenant."
        breadcrumbs={[{ label: "Business" }, { label: "Subscriptions" }]}
        actions={
          <Can perm="subscriptions.create">
            <Button onClick={() => edit(null)}>
              <TbPlus /> New subscription
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId="subscriptions"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        hideSearch
        filters={[
          { key: "status", label: "Status", options: STATUS_OPTIONS },
          { key: "tenant_id", label: "Tenant", options: (tenants.data ?? []).map((t) => ({ value: t.id, label: t.name })) },
        ]}
        onRowClick={can("subscriptions.update") ? edit : undefined}
        emptyTitle="No subscriptions"
      />
      <SubscriptionDialog open={open} onOpenChange={setOpen} sub={editing} />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Cancel subscription?"
        description="The subscription will be marked as canceled. The tenant keeps access until you suspend it."
        confirmText="Cancel subscription"
        onConfirm={() => (confirm.target ? cancel.mutateAsync(confirm.target.id) : undefined)}
      />
    </>
  );
}
