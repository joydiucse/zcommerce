import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { TbBuildingStore, TbEdit, TbExternalLink, TbPlayerPlay, TbPlayerPause, TbPlus, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { usePermissions } from "@/hooks/use-auth";
import { useActionMutation, useAllQuery, useDeleteMutation, useListQuery } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { formatDate } from "@/lib/format";
import type { Plan, Tenant } from "@/types";

export function TenantsPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const state = useTableState({ filterKeys: ["status", "plan_id"] });
  const { data, isLoading, isFetching } = useListQuery<Tenant>("/tenants", state.params);
  const plans = useAllQuery<Plan>("/plans");
  const del = useDeleteMutation("/tenants", { successMessage: "Tenant deleted" });
  const confirmDelete = useConfirmState<Tenant>();
  const confirmSuspend = useConfirmState<Tenant>();
  const toggle = useActionMutation<{ id: string; action: "suspend" | "activate" }>(
    ({ id, action }) => ({ path: `/tenants/${id}/${action}` }),
    { resourcePath: "/tenants", successMessage: "Tenant status updated", invalidate: ["/dashboard"] },
  );
  const planName = useMemo(() => new Map((plans.data ?? []).map((p) => [p.id, p.name])), [plans.data]);

  const columns = useMemo<ColumnDef<Tenant>[]>(
    () => [
      {
        accessorKey: "name",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Tenant" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
              <TbBuildingStore className="size-5" />
            </div>
            <div>
              <div className="font-medium">{row.original.name}</div>
              <div className="text-muted-foreground text-xs">{row.original.slug}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "site_url",
        meta: { label: "Store URL" },
        header: "Store URL",
        cell: ({ row }) =>
          row.original.site_url ? (
            <a
              href={row.original.site_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary inline-flex items-center gap-1 hover:underline"
            >
              {row.original.site_url.replace(/^https?:\/\//, "")}
              <TbExternalLink className="size-3.5" />
            </a>
          ) : (
            <span className="text-muted-foreground">Not set</span>
          ),
      },
      { accessorKey: "email", header: "Email", cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span> },
      {
        id: "plan",
        header: "Plan",
        cell: ({ row }) => row.original.plan?.name ?? (row.original.plan_id ? planName.get(row.original.plan_id) : null) ?? <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: "status",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "trial_ends_at",
        meta: { label: "Trial ends" },
        header: "Trial ends",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.status === "trial" ? formatDate(row.original.trial_ends_at) : "—"}</span>,
      },
      {
        accessorKey: "created_at",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Created" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>,
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => {
          const t = row.original;
          return (
            <RowActions
              actions={[
                { label: can("tenants.update") ? "Edit" : "View", icon: TbEdit, hidden: !can("tenants.update"), onClick: () => navigate(`/system/tenants/${t.id}`) },
                {
                  label: "Activate",
                  icon: TbPlayerPlay,
                  hidden: !can("tenants.update") || t.status === "active",
                  onClick: () => toggle.mutate({ id: t.id, action: "activate" }),
                },
                {
                  label: "Suspend",
                  icon: TbPlayerPause,
                  hidden: !can("tenants.update") || t.status === "suspended",
                  onClick: () => confirmSuspend.ask(t),
                },
                {
                  label: "Open storefront",
                  icon: TbExternalLink,
                  hidden: !t.site_url,
                  onClick: () => t.site_url && window.open(t.site_url, "_blank"),
                },
                { label: "Delete", icon: TbTrash, destructive: true, separatorBefore: true, hidden: !can("tenants.delete"), onClick: () => confirmDelete.ask(t) },
              ]}
            />
          );
        },
      },
    ],
    [can, navigate, toggle, confirmDelete, confirmSuspend, planName],
  );

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Merchant stores running on the platform."
        breadcrumbs={[{ label: "Business" }, { label: "Tenants" }]}
        actions={
          <Can perm="tenants.create">
            <Button asChild>
              <Link to="/system/tenants/new">
                <TbPlus /> New tenant
              </Link>
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId="tenants"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search name, slug, email or store URL…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "trial", label: "Trial" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ],
          },
          { key: "plan_id", label: "Plan", options: (plans.data ?? []).map((p) => ({ value: p.id, label: p.name })) },
        ]}
        onRowClick={can("tenants.update") ? (t) => navigate(`/system/tenants/${t.id}`) : undefined}
        emptyTitle="No tenants yet"
      />
      <ConfirmDialog
        open={confirmSuspend.open}
        onOpenChange={confirmSuspend.onOpenChange}
        title="Suspend tenant?"
        description={`${confirmSuspend.target?.name ?? ""} will lose access to its admin and its storefront will go offline.`}
        confirmText="Suspend"
        onConfirm={() => (confirmSuspend.target ? toggle.mutateAsync({ id: confirmSuspend.target.id, action: "suspend" }) : undefined)}
      />
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={confirmDelete.onOpenChange}
        title="Delete tenant?"
        description={`This permanently deletes ${confirmDelete.target?.name ?? ""} and ALL its data (products, orders, customers). This cannot be undone.`}
        onConfirm={() => (confirmDelete.target ? del.mutateAsync(confirmDelete.target.id) : undefined)}
      />
    </>
  );
}
