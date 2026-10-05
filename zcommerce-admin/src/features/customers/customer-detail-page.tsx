import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { TbArrowLeft, TbCalendar, TbEdit, TbMail, TbPhone, TbReceipt, TbShoppingBag } from "react-icons/tb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressBlock } from "@/components/common/address-block";
import { Can } from "@/components/common/can";
import { StatCard } from "@/components/common/charts";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { SimpleTable } from "@/components/data-table/simple-table";
import { CustomerDialog } from "@/features/customers/customer-dialog";
import { useDetailQuery } from "@/hooks/use-resource";
import { useMoney } from "@/hooks/use-settings";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { initials } from "@/lib/utils";
import type { Customer, Order } from "@/types";

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const money = useMoney();
  const { data: c, isLoading, isError } = useDetailQuery<Customer>("/customers", id);
  const [editOpen, setEditOpen] = useState(false);

  const orderColumns = useMemo<ColumnDef<Order>[]>(
    () => [
      { accessorKey: "order_number", header: "Order", cell: ({ row }) => <span className="font-medium">#{row.original.order_number}</span> },
      { id: "date", header: "Date", cell: ({ row }) => formatDateTime(row.original.placed_at ?? row.original.created_at) },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { accessorKey: "payment_status", header: "Payment", cell: ({ row }) => <StatusBadge status={row.original.payment_status} /> },
      {
        accessorKey: "grand_total",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => <div className="text-right font-medium tabular-nums">{money.format(row.original.grand_total, row.original.currency)}</div>,
      },
    ],
    [money],
  );

  if (isError) {
    return <EmptyState title="Customer not found" action={<Button asChild variant="outline"><Link to="/customers">Back to customers</Link></Button>} />;
  }

  const aov = c && c.orders_count > 0 ? Number(c.total_spent) / c.orders_count : 0;

  return (
    <>
      <PageHeader
        title={isLoading ? <Skeleton className="h-8 w-56" /> : c?.name}
        breadcrumbs={[{ label: "Sales" }, { label: "Customers", to: "/customers" }, { label: c?.name ?? "Customer" }]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/customers">
                <TbArrowLeft /> Back
              </Link>
            </Button>
            <Can perm="customers.update">
              <Button onClick={() => setEditOpen(true)} disabled={!c}>
                <TbEdit /> Edit
              </Button>
            </Can>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total spent" value={money.format(c?.total_spent)} icon={TbReceipt} loading={isLoading} />
        <StatCard label="Orders" value={formatNumber(c?.orders_count)} icon={TbShoppingBag} tone="info" loading={isLoading} />
        <StatCard label="Average order" value={money.format(aov)} icon={TbCalendar} tone="success" loading={isLoading} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              {isLoading || !c ? (
                <Skeleton className="h-28 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarFallback className="text-sm">{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="mt-1 flex gap-1.5">
                        <StatusBadge status={c.status} />
                        <StatusBadge status={c.accepts_marketing ? "active" : "inactive"} label={c.accepts_marketing ? "Subscribed" : "Not subscribed"} dot={false} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <a href={`mailto:${c.email}`} className="hover:text-primary flex items-center gap-2">
                      <TbMail className="text-muted-foreground size-4" /> {c.email}
                    </a>
                    {c.phone && (
                      <div className="flex items-center gap-2">
                        <TbPhone className="text-muted-foreground size-4" /> {c.phone}
                      </div>
                    )}
                    <div className="text-muted-foreground flex items-center gap-2">
                      <TbCalendar className="size-4" /> Customer since {formatDate(c.created_at)}
                    </div>
                    {c.last_order_at && (
                      <div className="text-muted-foreground flex items-center gap-2">
                        <TbShoppingBag className="size-4" /> Last order {formatDate(c.last_order_at)}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
              <CardDescription>{c?.addresses?.length ?? 0} saved</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : c?.addresses?.length ? (
                c.addresses.map((a, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <AddressBlock address={a} />
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No saved addresses.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="gap-3 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest orders from this customer</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <SimpleTable
              columns={orderColumns}
              data={c?.recent_orders}
              isLoading={isLoading}
              empty="This customer hasn't placed any orders yet."
              onRowClick={(o) => navigate(`/orders/${o.id}`)}
            />
          </CardContent>
        </Card>
      </div>

      <CustomerDialog open={editOpen} onOpenChange={setEditOpen} customer={c ?? null} />
    </>
  );
}
