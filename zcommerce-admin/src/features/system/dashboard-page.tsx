import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { TbArrowRight, TbBuildingStore, TbCash, TbClockHour4, TbFileInvoice } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleBarChart, StatCard } from "@/components/common/charts";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { SimpleTable } from "@/components/data-table/simple-table";
import { useGetQuery } from "@/hooks/use-resource";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { SystemDashboard, Tenant } from "@/types";

function monthLabel(v: string) {
  const d = new Date(v.length === 7 ? `${v}-01` : v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function SystemDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetQuery<SystemDashboard>("/dashboard");
  const usd = (v: number | undefined) => formatMoney(v ?? 0, { currency: "USD" });

  const columns = useMemo<ColumnDef<Tenant>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tenant",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-muted-foreground text-xs">{row.original.slug}</div>
          </div>
        ),
      },
      { id: "plan", header: "Plan", cell: ({ row }) => row.original.plan?.name ?? "—" },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { accessorKey: "created_at", header: "Created", cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span> },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Tenants, revenue and billing across zCommerce."
        actions={
          <Button asChild variant="outline">
            <Link to="/system/tenants">
              Manage tenants <TbArrowRight />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total tenants"
          value={formatNumber(data?.tenants_total)}
          hint={`${formatNumber(data?.tenants_active)} active`}
          icon={TbBuildingStore}
          loading={isLoading}
        />
        <StatCard label="On trial" value={formatNumber(data?.tenants_trial)} icon={TbClockHour4} tone="info" loading={isLoading} />
        <StatCard label="MRR" value={usd(data?.mrr)} hint="Monthly recurring revenue" icon={TbCash} tone="success" loading={isLoading} />
        <StatCard label="Open invoices" value={usd(data?.invoices_open_amount)} hint="Outstanding amount" icon={TbFileInvoice} tone="warning" loading={isLoading} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>New tenants by month</CardTitle>
            <CardDescription>Sign-ups over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <SimpleBarChart data={data?.tenants_by_month ?? []} xKey="month" yKey="count" name="Tenants" height={280} formatX={monthLabel} />
            )}
          </CardContent>
        </Card>
        <Card className="gap-3 xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent tenants</CardTitle>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link to="/system/tenants">All</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <SimpleTable
              columns={columns}
              data={data?.recent_tenants}
              isLoading={isLoading}
              empty="No tenants yet"
              onRowClick={(t) => navigate(`/system/tenants/${t.id}`)}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
