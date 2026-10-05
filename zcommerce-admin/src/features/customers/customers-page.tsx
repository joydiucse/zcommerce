import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { TbEdit, TbEye, TbPlus, TbTrash } from "react-icons/tb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { CustomerDialog } from "@/features/customers/customer-dialog";
import { usePermissions } from "@/hooks/use-auth";
import { useDeleteMutation, useListQuery } from "@/hooks/use-resource";
import { useMoney } from "@/hooks/use-settings";
import { useTableState } from "@/hooks/use-table-state";
import { formatDate, formatNumber } from "@/lib/format";
import { initials } from "@/lib/utils";
import type { Customer } from "@/types";

export function CustomersPage() {
  const navigate = useNavigate();
  const money = useMoney();
  const { can } = usePermissions();
  const state = useTableState({ filterKeys: ["status"] });
  const { data, isLoading, isFetching } = useListQuery<Customer>("/customers", state.params);
  const del = useDeleteMutation("/customers", { successMessage: "Customer deleted" });
  const confirm = useConfirmState<Customer>();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "name",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Customer" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium">{row.original.name}</div>
              <div className="text-muted-foreground text-xs">{row.original.email}</div>
            </div>
          </div>
        ),
      },
      { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.original.phone || <span className="text-muted-foreground">—</span> },
      {
        accessorKey: "orders_count",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Orders" />,
        cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.orders_count)}</span>,
      },
      {
        accessorKey: "total_spent",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Spent" />,
        cell: ({ row }) => <span className="font-medium tabular-nums">{money.format(row.original.total_spent)}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <StatusBadge status={row.original.status} />
            {!row.original.accepts_marketing ? null : <StatusBadge status="subscribed" label="Marketing" variant="info" dot={false} />}
          </div>
        ),
      },
      {
        accessorKey: "last_order_at",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Last order" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.last_order_at)}</span>,
      },
      {
        accessorKey: "created_at",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Joined" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>,
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <RowActions
            actions={[
              { label: "View", icon: TbEye, onClick: () => navigate(`/customers/${row.original.id}`) },
              {
                label: "Edit",
                icon: TbEdit,
                hidden: !can("customers.update"),
                onClick: () => {
                  setEditing(row.original);
                  setOpen(true);
                },
              },
              { label: "Delete", icon: TbTrash, destructive: true, separatorBefore: true, hidden: !can("customers.delete"), onClick: () => confirm.ask(row.original) },
            ]}
          />
        ),
      },
    ],
    [money, can, navigate, confirm],
  );

  return (
    <>
      <PageHeader
        title="Customers"
        description="People who have shopped or registered at your store."
        breadcrumbs={[{ label: "Sales" }, { label: "Customers" }]}
        actions={
          <Can perm="customers.create">
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <TbPlus /> Add customer
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId="customers"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search name, email or phone…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "disabled", label: "Disabled" },
            ],
          },
        ]}
        onRowClick={(c) => navigate(`/customers/${c.id}`)}
        emptyTitle="No customers yet"
        emptyDescription="Customers appear here after they register or place an order."
      />
      <CustomerDialog open={open} onOpenChange={setOpen} customer={editing} />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete customer?"
        description={`${confirm.target?.name ?? ""} will be permanently removed. Their past orders are kept.`}
        onConfirm={() => (confirm.target ? del.mutateAsync(confirm.target.id) : undefined)}
      />
    </>
  );
}
