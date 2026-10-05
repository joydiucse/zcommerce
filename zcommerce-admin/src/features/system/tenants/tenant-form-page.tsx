import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import { TbArrowLeft, TbPlayerPause, TbPlayerPlay } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { FormSkeleton } from "@/components/common/loaders";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { SimpleTable } from "@/components/data-table/simple-table";
import { FormSection, SubmitButton } from "@/components/forms/form-section";
import { SelectField, TextField } from "@/components/forms/fields";
import { usePermissions } from "@/hooks/use-auth";
import { useActionMutation, useAllQuery, useCreateMutation, useDetailQuery, useListQuery, useUpdateMutation } from "@/hooks/use-resource";
import { applyApiErrors } from "@/lib/errors";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { slugify } from "@/lib/utils";
import type { Invoice, Plan, Subscription, Tenant } from "@/types";

const base = {
  name: z.string().trim().min(1, "Store name is required"),
  slug: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and single dashes"),
  email: z.email("Enter a valid email"),
  phone: z.string().trim(),
  plan_id: z.string().nullable(),
  site_url: z
    .string()
    .trim()
    .regex(/^$|^https?:\/\/[^\s/]+(\/.*)?$/i, "Enter a full URL like https://shop.example.com"),
};

const createSchema = z.object({
  ...base,
  owner: z.object({
    name: z.string().trim().min(1, "Owner name is required"),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
  }),
});
type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object(base);
type EditValues = z.infer<typeof editSchema>;

function usePlanOptions() {
  const plans = useAllQuery<Plan>("/plans");
  return (plans.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.name} — ${formatMoney(p.price_monthly, { currency: p.currency })}/mo${p.is_active ? "" : " (inactive)"}`,
  }));
}

function CreateTenant() {
  const navigate = useNavigate();
  const planOptions = usePlanOptions();
  const create = useCreateMutation<Record<string, unknown>, Tenant>("/tenants", { successMessage: "Tenant created", invalidate: ["/dashboard"] });
  const slugTouched = useRef(false);
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", slug: "", email: "", phone: "", plan_id: null, site_url: "", owner: { name: "", email: "", password: "" } },
  });

  const onSubmit = async (v: CreateValues) => {
    try {
      const created = await create.mutateAsync({
        ...v,
        phone: v.phone || undefined,
        plan_id: v.plan_id || undefined,
        site_url: v.site_url || undefined,
      });
      navigate(created?.id ? `/system/tenants/${created.id}` : "/system/tenants", { replace: true });
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <PageHeader
          title="New tenant"
          description="Creates the store, default roles, the owner account, default settings and a trial subscription."
          breadcrumbs={[{ label: "Business" }, { label: "Tenants", to: "/system/tenants" }, { label: "New" }]}
          actions={
            <>
              <Button asChild variant="outline" type="button">
                <Link to="/system/tenants">
                  <TbArrowLeft /> Back
                </Link>
              </Button>
              <SubmitButton loading={form.formState.isSubmitting}>Create tenant</SubmitButton>
            </>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <FormSection title="Store">
            <TextField
              control={form.control}
              name="name"
              label="Store name"
              onValueChange={(v) => !slugTouched.current && form.setValue("slug", slugify(v))}
            />
            <TextField control={form.control} name="slug" label="Slug" description="Used for login and the X-Tenant header." onValueChange={() => (slugTouched.current = true)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={form.control} name="email" label="Store email" type="email" />
              <TextField control={form.control} name="phone" label="Phone" />
            </div>
            <SelectField control={form.control} name="plan_id" label="Plan" options={planOptions} noneLabel="No plan" />
            <TextField
              control={form.control}
              name="site_url"
              label="Store URL"
              placeholder="https://shop.example.com"
              description="Public storefront URL. Visitors to this host (and port) see this store, e.g. http://localhost:3002."
            />
          </FormSection>
          <FormSection title="Owner account" description="The first staff user, with full access (Owner role).">
            <TextField control={form.control} name="owner.name" label="Owner name" />
            <TextField control={form.control} name="owner.email" label="Owner email" type="email" autoComplete="off" />
            <TextField control={form.control} name="owner.password" label="Password" type="password" autoComplete="new-password" description="At least 8 characters. Share it securely with the merchant." />
          </FormSection>
        </div>
      </form>
    </Form>
  );
}

function EditTenant({ id }: { id: string }) {
  const { can } = usePermissions();
  const planOptions = usePlanOptions();
  const detail = useDetailQuery<Tenant>("/tenants", id);
  const update = useUpdateMutation<Record<string, unknown>>("/tenants", { successMessage: "Tenant saved" });
  const toggle = useActionMutation<"suspend" | "activate">((action) => ({ path: `/tenants/${id}/${action}` }), {
    resourcePath: "/tenants",
    successMessage: "Tenant status updated",
    invalidate: ["/dashboard"],
  });
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const subs = useListQuery<Subscription>("/subscriptions", { tenant_id: id, limit: 10 });
  const invoices = useListQuery<Invoice>("/billing/invoices", { tenant_id: id, limit: 10 });
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", slug: "", email: "", phone: "", plan_id: null, site_url: "" },
  });

  useEffect(() => {
    const t = detail.data;
    if (t) form.reset({ name: t.name, slug: t.slug, email: t.email, phone: t.phone ?? "", plan_id: t.plan_id, site_url: t.site_url ?? "" });
  }, [detail.data, form]);

  const onSubmit = async (v: EditValues) => {
    try {
      await update.mutateAsync({ id, body: { ...v, phone: v.phone || null, site_url: v.site_url || null } });
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  const subColumns = useMemo<ColumnDef<Subscription>[]>(
    () => [
      { id: "plan", header: "Plan", cell: ({ row }) => row.original.plan?.name ?? "—" },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { accessorKey: "billing_cycle", header: "Cycle", cell: ({ row }) => <span className="capitalize">{row.original.billing_cycle}</span> },
      { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatMoney(row.original.amount) },
      { id: "period", header: "Period ends", cell: ({ row }) => formatDate(row.original.current_period_end) },
    ],
    [],
  );
  const invColumns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      { accessorKey: "number", header: "Invoice", cell: ({ row }) => <span className="font-mono text-xs">{row.original.number}</span> },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatMoney(row.original.amount, { currency: row.original.currency }) },
      { accessorKey: "due_date", header: "Due", cell: ({ row }) => formatDate(row.original.due_date) },
    ],
    [],
  );

  if (detail.isLoading) {
    return (
      <>
        <PageHeader title="Loading tenant…" />
        <FormSkeleton />
      </>
    );
  }
  const t = detail.data;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              {t?.name ?? "Tenant"} {t && <StatusBadge status={t.status} className="text-xs" />}
            </span>
          }
          description={t ? `Created ${formatDateTime(t.created_at)}${t.status === "trial" && t.trial_ends_at ? ` · trial ends ${formatDate(t.trial_ends_at)}` : ""}` : undefined}
          breadcrumbs={[{ label: "Business" }, { label: "Tenants", to: "/system/tenants" }, { label: t?.name ?? "Edit" }]}
          actions={
            <>
              <Button asChild variant="outline" type="button">
                <Link to="/system/tenants">
                  <TbArrowLeft /> Back
                </Link>
              </Button>
              {can("tenants.update") && t && t.status !== "suspended" && (
                <Button type="button" variant="outline" onClick={() => setConfirmSuspend(true)}>
                  <TbPlayerPause /> Suspend
                </Button>
              )}
              {can("tenants.update") && t && t.status !== "active" && (
                <Button type="button" variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate("activate")}>
                  <TbPlayerPlay /> Activate
                </Button>
              )}
              <SubmitButton loading={form.formState.isSubmitting}>Save changes</SubmitButton>
            </>
          }
        />
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <FormSection title="Store details">
              <TextField control={form.control} name="name" label="Store name" />
              <TextField control={form.control} name="slug" label="Slug" description="Changing this changes the merchant login." />
              <TextField control={form.control} name="email" label="Store email" type="email" />
              <TextField control={form.control} name="phone" label="Phone" />
              <SelectField control={form.control} name="plan_id" label="Plan" options={planOptions} noneLabel="No plan" />
              <TextField
                control={form.control}
                name="site_url"
                label="Store URL"
                placeholder="https://shop.example.com"
                description="Public storefront URL. Visitors to this host (and port) see this store, e.g. http://localhost:3002."
              />
            </FormSection>
          </div>
          <div className="space-y-4 lg:col-span-3">
            <Card className="gap-3">
              <CardHeader>
                <CardTitle>Subscriptions</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <SimpleTable columns={subColumns} data={subs.data?.data} isLoading={subs.isLoading} empty="No subscriptions" />
              </CardContent>
            </Card>
            <Card className="gap-3">
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <SimpleTable columns={invColumns} data={invoices.data?.data} isLoading={invoices.isLoading} empty="No invoices" />
              </CardContent>
            </Card>
          </div>
        </div>
        <ConfirmDialog
          open={confirmSuspend}
          onOpenChange={setConfirmSuspend}
          title="Suspend tenant?"
          description="The merchant will lose access and the storefront will go offline until reactivated."
          confirmText="Suspend"
          onConfirm={() => toggle.mutateAsync("suspend")}
        />
      </form>
    </Form>
  );
}

export function TenantFormPage() {
  const { id } = useParams();
  return id ? <EditTenant id={id} /> : <CreateTenant />;
}

