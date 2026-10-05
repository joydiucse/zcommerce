import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import { TbBan, TbCircleCheck, TbEye, TbPlus, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { SimpleTable } from "@/components/data-table/simple-table";
import { FormDialog } from "@/components/forms/form-dialog";
import { MoneyField, NumberField, SelectField, TextField } from "@/components/forms/fields";
import { usePermissions } from "@/hooks/use-auth";
import { useActionMutation, useAllQuery, useCreateMutation, useListQuery } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { applyApiErrors } from "@/lib/errors";
import { formatDate, formatDateTime, formatMoney, toISODate } from "@/lib/format";
import type { Invoice, InvoiceItem, Subscription, Tenant } from "@/types";

const PATH = "/billing/invoices";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

const schema = z.object({
  tenant_id: z.string().nullable().refine((v) => !!v, "Select a tenant"),
  subscription_id: z.string().nullable(),
  currency: z.string().trim().length(3, "3-letter code"),
  status: z.enum(["draft", "open"]),
  due_date: z.string().min(1, "Due date is required"),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Required"),
        quantity: z.number().int().min(1),
        unit_price: z.number().min(0),
      }),
    )
    .min(1, "Add at least one line item"),
});
type Values = z.infer<typeof schema>;

function CreateInvoiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const tenants = useAllQuery<Tenant>("/tenants", {}, open);
  const create = useCreateMutation<Record<string, unknown>>(PATH, { successMessage: "Invoice created", invalidate: ["/dashboard"] });
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const defaults: Values = {
    tenant_id: null,
    subscription_id: null,
    currency: "USD",
    status: "open",
    due_date: toISODate(due),
    items: [{ description: "", quantity: 1, unit_price: 0 }],
  };
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });
  const items = useFieldArray({ control: form.control, name: "items" });
  const [tenantId, lines, currency] = useWatch({ control: form.control, name: ["tenant_id", "items", "currency"] });
  const subs = useListQuery<Subscription>("/subscriptions", { tenant_id: tenantId ?? undefined, limit: 50 }, { enabled: !!tenantId && open });

  useEffect(() => {
    if (open) form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = (lines ?? []).reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);

  const onSubmit = async (v: Values) => {
    const lineItems: InvoiceItem[] = v.items.map((i) => ({ ...i, amount: Math.round(i.quantity * i.unit_price * 100) / 100 }));
    try {
      await create.mutateAsync({
        ...v,
        currency: v.currency.toUpperCase(),
        subscription_id: v.subscription_id || null,
        due_date: new Date(v.due_date).toISOString(),
        items: lineItems,
        amount: Math.round(total * 100) / 100,
      });
      onOpenChange(false);
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="New invoice" form={form} onSubmit={onSubmit} submitText="Create invoice" className="sm:max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          control={form.control}
          name="tenant_id"
          label="Tenant"
          placeholder={tenants.isLoading ? "Loading…" : "Select tenant"}
          options={(tenants.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
        />
        <SelectField
          control={form.control}
          name="subscription_id"
          label="Subscription (optional)"
          noneLabel="None"
          disabled={!tenantId}
          options={(subs.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.plan?.name ?? "Plan"} · ${s.billing_cycle} · ${s.status}` }))}
        />
        <TextField control={form.control} name="due_date" label="Due date" type="date" />
        <div className="grid grid-cols-2 gap-4">
          <TextField control={form.control} name="currency" label="Currency" onValueChange={(v) => form.setValue("currency", v.toUpperCase())} />
          <SelectField
            control={form.control}
            name="status"
            label="Status"
            options={[
              { value: "open", label: "Open" },
              { value: "draft", label: "Draft" },
            ]}
          />
        </div>
      </div>
      <div className="space-y-2 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Line items</p>
          <Button type="button" size="sm" variant="outline" onClick={() => items.append({ description: "", quantity: 1, unit_price: 0 })}>
            <TbPlus /> Add item
          </Button>
        </div>
        {items.fields.map((f, i) => (
          <div key={f.id} className="grid grid-cols-[1fr_80px_120px_auto] items-start gap-2">
            <TextField control={form.control} name={`items.${i}.description`} placeholder="Description" />
            <NumberField control={form.control} name={`items.${i}.quantity`} min={1} />
            <MoneyField control={form.control} name={`items.${i}.unit_price`} symbol="" />
            <Button type="button" variant="ghost" size="icon" disabled={items.fields.length === 1} onClick={() => items.remove(i)} aria-label="Remove item">
              <TbTrash />
            </Button>
          </div>
        ))}
        {form.formState.errors.items?.root?.message && <p className="text-destructive text-xs">{form.formState.errors.items.root.message}</p>}
        <Separator className="my-2" />
        <div className="flex justify-end gap-3 text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold tabular-nums">{formatMoney(total, { currency: currency?.length === 3 ? currency.toUpperCase() : "USD" })}</span>
        </div>
      </div>
    </FormDialog>
  );
}

function InvoiceDetailDialog({ invoice, onOpenChange, tenantName }: { invoice: Invoice | null; onOpenChange: (o: boolean) => void; tenantName?: string }) {
  const columns = useMemo<ColumnDef<InvoiceItem>[]>(
    () => [
      { accessorKey: "description", header: "Description" },
      { accessorKey: "quantity", header: () => <div className="text-right">Qty</div>, cell: ({ row }) => <div className="text-right">{row.original.quantity}</div> },
      {
        accessorKey: "unit_price",
        header: () => <div className="text-right">Unit price</div>,
        cell: ({ row }) => <div className="text-right tabular-nums">{formatMoney(row.original.unit_price, { currency: invoice?.currency })}</div>,
      },
      {
        id: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium tabular-nums">
            {formatMoney(row.original.amount ?? row.original.quantity * row.original.unit_price, { currency: invoice?.currency })}
          </div>
        ),
      },
    ],
    [invoice?.currency],
  );
  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Invoice {invoice?.number} {invoice && <StatusBadge status={invoice.status} />}
          </DialogTitle>
          <DialogDescription>
            {tenantName ?? invoice?.tenant?.name} · due {formatDate(invoice?.due_date)}
            {invoice?.paid_at ? ` · paid ${formatDateTime(invoice.paid_at)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border">
          <SimpleTable columns={columns} data={invoice?.items ?? []} empty="No line items" />
        </div>
        <div className="flex justify-end gap-3 text-base">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold tabular-nums">{formatMoney(invoice?.amount, { currency: invoice?.currency })}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InvoicesPage() {
  const { can } = usePermissions();
  const state = useTableState({ filterKeys: ["status", "tenant_id"] });
  const { data, isLoading, isFetching } = useListQuery<Invoice>(PATH, state.params);
  const tenants = useAllQuery<Tenant>("/tenants");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const confirmVoid = useConfirmState<Invoice>();
  const markPaid = useActionMutation<string>((id) => ({ path: `${PATH}/${id}/mark-paid` }), {
    resourcePath: PATH,
    successMessage: "Invoice marked as paid",
    invalidate: ["/dashboard"],
  });
  const voidInv = useActionMutation<string>((id) => ({ path: `${PATH}/${id}/void` }), {
    resourcePath: PATH,
    successMessage: "Invoice voided",
    invalidate: ["/dashboard"],
  });
  const tenantName = useMemo(() => new Map((tenants.data ?? []).map((t) => [t.id, t.name])), [tenants.data]);
  const canUpdate = can("billing.update");

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "number",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Invoice" />,
        cell: ({ row }) => <span className="font-mono text-xs font-semibold">{row.original.number}</span>,
      },
      { id: "tenant", header: "Tenant", cell: ({ row }) => row.original.tenant?.name ?? tenantName.get(row.original.tenant_id) ?? "—" },
      {
        accessorKey: "amount",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => <span className="font-medium tabular-nums">{formatMoney(row.original.amount, { currency: row.original.currency })}</span>,
      },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        accessorKey: "due_date",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Due" />,
        cell: ({ row }) => {
          const overdue = row.original.status === "open" && row.original.due_date && new Date(row.original.due_date) < new Date();
          return <span className={overdue ? "text-destructive font-medium" : "text-muted-foreground"}>{formatDate(row.original.due_date)}</span>;
        },
      },
      { accessorKey: "paid_at", meta: { label: "Paid" }, header: "Paid", cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.paid_at)}</span> },
      {
        accessorKey: "created_at",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Issued" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>,
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => {
          const inv = row.original;
          return (
            <RowActions
              actions={[
                { label: "View", icon: TbEye, onClick: () => setViewing(inv) },
                {
                  label: "Mark as paid",
                  icon: TbCircleCheck,
                  hidden: !canUpdate || inv.status === "paid" || inv.status === "void",
                  onClick: () => markPaid.mutate(inv.id),
                },
                {
                  label: "Void",
                  icon: TbBan,
                  destructive: true,
                  separatorBefore: true,
                  hidden: !canUpdate || inv.status === "void" || inv.status === "paid",
                  onClick: () => confirmVoid.ask(inv),
                },
              ]}
            />
          );
        },
      },
    ],
    [canUpdate, confirmVoid, markPaid, tenantName],
  );

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Billing documents issued to tenants."
        breadcrumbs={[{ label: "Business" }, { label: "Invoices" }]}
        actions={
          <Can perm="billing.update">
            <Button onClick={() => setCreateOpen(true)}>
              <TbPlus /> New invoice
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId="invoices"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search invoice number…"
        filters={[
          { key: "status", label: "Status", options: STATUS_OPTIONS },
          { key: "tenant_id", label: "Tenant", options: (tenants.data ?? []).map((t) => ({ value: t.id, label: t.name })) },
        ]}
        onRowClick={setViewing}
        emptyTitle="No invoices"
      />
      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <InvoiceDetailDialog invoice={viewing} onOpenChange={(o) => !o && setViewing(null)} tenantName={viewing ? tenantName.get(viewing.tenant_id) : undefined} />
      <ConfirmDialog
        open={confirmVoid.open}
        onOpenChange={confirmVoid.onOpenChange}
        title="Void invoice?"
        description={`Invoice ${confirmVoid.target?.number ?? ""} will be voided and can no longer be paid.`}
        confirmText="Void invoice"
        onConfirm={() => (confirmVoid.target ? voidInv.mutateAsync(confirmVoid.target.id) : undefined)}
      />
    </>
  );
}
