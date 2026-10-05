import { useMemo } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { TbEye } from "react-icons/tb";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DateRangeInput } from "@/components/common/date-range";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { ORDER_STATUSES, PAYMENT_STATUSES, paymentMethodLabel } from "@/features/orders/constants";
import { useListQuery } from "@/hooks/use-resource";
import { useMoney } from "@/hooks/use-settings";
import { useTableState } from "@/hooks/use-table-state";
import { formatDateTime } from "@/lib/format";
import type { Order } from "@/types";

export function OrdersPage() {
  const navigate = useNavigate();
  const money = useMoney();
  const state = useTableState({ filterKeys: ["status", "payment_status", "from", "to"] });
  const { data, isLoading, isFetching } = useListQuery<Order>("/orders", state.params);

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "order_number",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Order" />,
        cell: ({ row }) => <span className="font-semibold">#{row.original.order_number}</span>,
      },
      {
        accessorKey: "placed_at",
        meta: { label: "Date" },
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Date" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.placed_at ?? row.original.created_at)}</span>,
      },
      {
        id: "customer",
        header: "Customer",
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="max-w-[200px] truncate font-medium">
              {row.original.customer?.name ?? row.original.shipping_address?.name ?? "Guest"}
            </div>
            <div className="text-muted-foreground max-w-[200px] truncate text-xs">{row.original.email}</div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "payment_status",
        meta: { label: "Payment" },
        header: "Payment",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <StatusBadge status={row.original.payment_status} />
            <span className="text-muted-foreground text-[11px]">{paymentMethodLabel(row.original.payment_method)}</span>
          </div>
        ),
      },
      {
        accessorKey: "fulfillment_status",
        meta: { label: "Fulfillment" },
        header: "Fulfillment",
        cell: ({ row }) => <StatusBadge status={row.original.fulfillment_status} />,
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => <span className="tabular-nums">{row.original.items_count ?? row.original.items?.length ?? "—"}</span>,
      },
      {
        accessorKey: "grand_total",
        meta: { label: "Total" },
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Total" />,
        cell: ({ row }) => <span className="font-medium tabular-nums">{money.format(row.original.grand_total, row.original.currency)}</span>,
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => <RowActions actions={[{ label: "View order", icon: TbEye, onClick: () => navigate(`/orders/${row.original.id}`) }]} />,
      },
    ],
    [money, navigate],
  );

  return (
    <>
      <PageHeader title="Orders" description="Track, fulfil and manage customer orders." breadcrumbs={[{ label: "Sales" }, { label: "Orders" }]} />
      <DataTable
        tableId="orders"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search order #, email or name…"
        filters={[
          { key: "status", label: "Status", options: ORDER_STATUSES },
          { key: "payment_status", label: "Payment", options: PAYMENT_STATUSES },
        ]}
        toolbarExtra={
          <DateRangeInput
            value={{ from: state.filters.from, to: state.filters.to }}
            onChange={(v) => state.setFilters({ from: v.from, to: v.to })}
          />
        }
        onRowClick={(o) => navigate(`/orders/${o.id}`)}
        emptyTitle="No orders yet"
        emptyDescription="Orders placed in your storefront will show up here."
      />
    </>
  );
}
