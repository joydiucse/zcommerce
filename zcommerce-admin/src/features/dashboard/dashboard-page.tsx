import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  TbAlertTriangle,
  TbArrowRight,
  TbBox,
  TbCash,
  TbClockHour4,
  TbShoppingCart,
  TbUsers,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { StatCard, TrendAreaChart } from "@/components/common/charts";
import { StatusBadge } from "@/components/common/status-badge";
import { SimpleTable } from "@/components/data-table/simple-table";
import { useMe } from "@/hooks/use-auth";
import { useGetQuery } from "@/hooks/use-resource";
import { useMoney } from "@/hooks/use-settings";
import { formatNumber, formatRelative } from "@/lib/format";
import type { Order, TenantDashboard } from "@/types";

function shortDate(v: string) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DashboardPage() {
  const me = useMe();
  const navigate = useNavigate();
  const money = useMoney();
  const { data, isLoading } = useGetQuery<TenantDashboard>("/dashboard");

  const chartTotal = useMemo(
    () => (data?.sales_chart ?? []).reduce((s, d) => s + Number(d.revenue || 0), 0),
    [data?.sales_chart],
  );
  const chartOrders = useMemo(
    () => (data?.sales_chart ?? []).reduce((s, d) => s + Number(d.orders || 0), 0),
    [data?.sales_chart],
  );

  const orderColumns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "order_number",
        header: "Order",
        cell: ({ row }) => <span className="font-medium">#{row.original.order_number}</span>,
      },
      {
        id: "customer",
        header: "Customer",
        cell: ({ row }) => (
          <div className="max-w-[180px] truncate">{row.original.customer?.name ?? row.original.email}</div>
        ),
      },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        accessorKey: "grand_total",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium tabular-nums">{money.format(row.original.grand_total, row.original.currency)}</div>
        ),
      },
      {
        id: "when",
        header: "Placed",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">{formatRelative(row.original.placed_at ?? row.original.created_at)}</span>
        ),
      },
    ],
    [money],
  );

  const firstName = me.data?.user.name?.split(" ")[0];
  const maxTop = Math.max(1, ...(data?.top_products ?? []).map((p) => Number(p.revenue)));

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        description={`Here's what's happening at ${me.data?.tenant?.name ?? "your store"} today.`}
        actions={
          <Button asChild variant="outline">
            <Link to="/reports">
              View reports <TbArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={money.format(data?.revenue_today)}
          hint={<>This month: <span className="text-foreground font-medium">{money.format(data?.revenue_month)}</span></>}
          icon={TbCash}
          loading={isLoading}
        />
        <StatCard
          label="Orders today"
          value={formatNumber(data?.orders_today)}
          hint={<>This month: <span className="text-foreground font-medium">{formatNumber(data?.orders_month)}</span></>}
          icon={TbShoppingCart}
          tone="info"
          loading={isLoading}
        />
        <StatCard
          label="Customers"
          value={formatNumber(data?.customers_total)}
          hint={<>{formatNumber(data?.products_total)} products in catalog</>}
          icon={TbUsers}
          tone="success"
          loading={isLoading}
        />
        <StatCard
          label="Needs attention"
          value={formatNumber(data?.pending_orders)}
          hint={
            <Link to="/inventory?stock=low" className="hover:text-foreground inline-flex items-center gap-1">
              <TbAlertTriangle className="text-warning size-3.5" />
              {formatNumber(data?.low_stock_count)} low-stock products
            </Link>
          }
          icon={TbClockHour4}
          tone="warning"
          loading={isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Sales — last 30 days</CardTitle>
            <CardDescription>
              {isLoading ? (
                <Skeleton className="h-4 w-48" />
              ) : (
                <>
                  <span className="text-foreground font-medium">{money.format(chartTotal)}</span> revenue from{" "}
                  <span className="text-foreground font-medium">{formatNumber(chartOrders)}</span> orders
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <TrendAreaChart
                data={data?.sales_chart ?? []}
                xKey="date"
                yKey="revenue"
                name="Revenue"
                formatValue={(v) => money.format(v)}
                formatX={shortDate}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>Best sellers by revenue</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link to="/products">All</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
            ) : data?.top_products?.length ? (
              data.top_products.slice(0, 6).map((p, i) => (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <Link to={`/products/${p.id}`} className="flex min-w-0 items-center gap-2 hover:underline">
                      <span className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold">
                        {i + 1}
                      </span>
                      <span className="truncate font-medium">{p.name}</span>
                    </Link>
                    <span className="shrink-0 font-medium tabular-nums">{money.format(p.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                      <div className="bg-chart-1 h-full rounded-full" style={{ width: `${(Number(p.revenue) / maxTop) * 100}%` }} />
                    </div>
                    <span className="text-muted-foreground w-14 text-right text-xs">{formatNumber(p.quantity)} sold</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-sm">
                <TbBox className="size-6" /> No sales yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 gap-3">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>The latest orders placed in your store</CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link to="/orders">
                View all <TbArrowRight />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <SimpleTable
            columns={orderColumns}
            data={data?.recent_orders}
            isLoading={isLoading}
            empty="No orders yet"
            onRowClick={(o) => navigate(`/orders/${o.id}`)}
          />
        </CardContent>
      </Card>
    </>
  );
}
