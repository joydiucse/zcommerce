import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { TbCash, TbPackage, TbReceipt, TbShoppingCart } from "react-icons/tb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleBarChart, StatCard, TrendAreaChart } from "@/components/common/charts";
import { DateRangeInput, type DateRangeValue } from "@/components/common/date-range";
import { PageHeader } from "@/components/common/page-header";
import { SimpleTable } from "@/components/data-table/simple-table";
import { useGetQuery } from "@/hooks/use-resource";
import { useMoney } from "@/hooks/use-settings";
import { daysAgo, formatNumber, toISODate } from "@/lib/format";
import type { CustomerReportRow, ProductReportRow, SalesReport } from "@/types";

type GroupBy = "day" | "week" | "month";

function periodLabel(v: string, group: GroupBy) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  if (group === "month") return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ReportsPage() {
  const money = useMoney();
  const [range, setRange] = useState<DateRangeValue>({ from: daysAgo(29), to: toISODate(new Date()) });
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const params = { from: range.from, to: range.to };

  const sales = useGetQuery<SalesReport>("/reports/sales", { ...params, group_by: groupBy });
  const products = useGetQuery<ProductReportRow[]>("/reports/products", params);
  const customers = useGetQuery<CustomerReportRow[]>("/reports/customers", params);

  const productCols = useMemo<ColumnDef<ProductReportRow>[]>(
    () => [
      {
        id: "rank",
        header: "#",
        cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.index + 1}</span>,
      },
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => (
          <div>
            <div className="max-w-[240px] truncate font-medium">{row.original.name}</div>
            {row.original.sku && <div className="text-muted-foreground text-xs">{row.original.sku}</div>}
          </div>
        ),
      },
      {
        accessorKey: "quantity",
        header: () => <div className="text-right">Units</div>,
        cell: ({ row }) => <div className="text-right tabular-nums">{formatNumber(row.original.quantity)}</div>,
      },
      {
        accessorKey: "revenue",
        header: () => <div className="text-right">Revenue</div>,
        cell: ({ row }) => <div className="text-right font-medium tabular-nums">{money.format(row.original.revenue)}</div>,
      },
    ],
    [money],
  );

  const customerCols = useMemo<ColumnDef<CustomerReportRow>[]>(
    () => [
      {
        id: "rank",
        header: "#",
        cell: ({ row }) => <span className="text-muted-foreground tabular-nums">{row.index + 1}</span>,
      },
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <div className="max-w-[220px] truncate font-medium">{row.original.name}</div>
            <div className="text-muted-foreground max-w-[220px] truncate text-xs">{row.original.email}</div>
          </div>
        ),
      },
      {
        accessorKey: "orders",
        header: () => <div className="text-right">Orders</div>,
        cell: ({ row }) => <div className="text-right tabular-nums">{formatNumber(row.original.orders)}</div>,
      },
      {
        id: "spent",
        header: () => <div className="text-right">Spent</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium tabular-nums">{money.format(row.original.revenue ?? row.original.total_spent ?? 0)}</div>
        ),
      },
    ],
    [money],
  );

  const s = sales.data?.summary;
  const series = sales.data?.series ?? [];

  return (
    <>
      <PageHeader
        title="Reports"
        description="Analyze sales performance, best sellers and top customers."
        breadcrumbs={[{ label: "Overview" }, { label: "Reports" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeInput value={range} onChange={setRange} presets />
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger size="sm" className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">By day</SelectItem>
                <SelectItem value="week">By week</SelectItem>
                <SelectItem value="month">By month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={money.format(s?.revenue)} icon={TbCash} loading={sales.isLoading} />
        <StatCard label="Orders" value={formatNumber(s?.orders)} icon={TbShoppingCart} tone="info" loading={sales.isLoading} />
        <StatCard label="Average order value" value={money.format(s?.average_order_value)} icon={TbReceipt} tone="success" loading={sales.isLoading} />
        <StatCard label="Items sold" value={formatNumber(s?.items_sold)} icon={TbPackage} tone="warning" loading={sales.isLoading} />
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Sales over time</CardTitle>
            <CardDescription>
              {metric === "revenue" ? "Revenue" : "Orders"} grouped by {groupBy}
            </CardDescription>
          </div>
          <Tabs value={metric} onValueChange={(v) => setMetric(v as "revenue" | "orders")}>
            <TabsList>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {sales.isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : series.length === 0 ? (
            <div className="text-muted-foreground flex h-[300px] items-center justify-center text-sm">No sales in this period</div>
          ) : metric === "revenue" ? (
            <TrendAreaChart
              data={series}
              xKey="period"
              yKey="revenue"
              name="Revenue"
              height={300}
              formatValue={(v) => money.format(v)}
              formatX={(v) => periodLabel(v, groupBy)}
            />
          ) : (
            <SimpleBarChart
              data={series}
              xKey="period"
              yKey="orders"
              name="Orders"
              height={300}
              formatValue={(v) => formatNumber(v)}
              formatX={(v) => periodLabel(v, groupBy)}
            />
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="gap-3">
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>Best sellers in the selected period</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <SimpleTable columns={productCols} data={products.data} isLoading={products.isLoading} empty="No product sales in this period" />
          </CardContent>
        </Card>
        <Card className="gap-3">
          <CardHeader>
            <CardTitle>Top customers</CardTitle>
            <CardDescription>Highest spending customers in the selected period</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <SimpleTable columns={customerCols} data={customers.data} isLoading={customers.isLoading} empty="No customer orders in this period" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
