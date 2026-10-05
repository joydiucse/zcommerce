import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { PAYMENT_METHODS, PAYMENT_STATUSES, paymentMethodLabel } from "@/features/orders/constants";
import { useListQuery } from "@/hooks/use-resource";
import { useMoney } from "@/hooks/use-settings";
import { useTableState } from "@/hooks/use-table-state";
import { formatDateTime } from "@/lib/format";
import type { Payment } from "@/types";

export function PaymentsPage() {
  const money = useMoney();
  const navigate = useNavigate();
  const state = useTableState({ filterKeys: ["status", "method"] });
  const { data, isLoading, isFetching } = useListQuery<Payment>("/payments", state.params);

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        id: "order",
        header: "Order",
        enableHiding: false,
        cell: ({ row }) => {
          const num = row.original.order?.order_number ?? row.original.order_number;
          return (
            <Link to={`/orders/${row.original.order_id}`} className="text-primary font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
              {num ? `#${num}` : "View order"}
            </Link>
          );
        },
      },
      { accessorKey: "method", header: "Method", cell: ({ row }) => paymentMethodLabel(row.original.method) },
      {
        accessorKey: "status",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "amount",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => <span className="font-medium tabular-nums">{money.format(row.original.amount, row.original.currency)}</span>,
      },
      {
        accessorKey: "transaction_ref",
        meta: { label: "Reference" },
        header: "Reference",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.transaction_ref || "—"}</span>,
      },
      {
        accessorKey: "paid_at",
        meta: { label: "Paid at" },
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Paid at" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.paid_at)}</span>,
      },
      {
        accessorKey: "created_at",
        meta: { label: "Created" },
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Created" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.created_at)}</span>,
      },
    ],
    [money],
  );

  return (
    <>
      <PageHeader
        title="Payments"
        description="Payment records for all orders. Update payment status from the order page."
        breadcrumbs={[{ label: "Sales" }, { label: "Payments" }]}
      />
      <DataTable
        tableId="payments"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search reference or order #…"
        filters={[
          { key: "status", label: "Status", options: PAYMENT_STATUSES },
          { key: "method", label: "Method", options: PAYMENT_METHODS },
        ]}
        onRowClick={(p) => navigate(`/orders/${p.order_id}`)}
        emptyTitle="No payments yet"
      />
    </>
  );
}
