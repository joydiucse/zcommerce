import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: IconType;
  loading?: boolean;
  tone?: "primary" | "success" | "warning" | "info" | "destructive";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-amber-600 dark:text-warning",
    info: "bg-sky-500/12 text-sky-600 dark:text-sky-300",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className="gap-0 py-5">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          )}
          {hint && <div className="text-muted-foreground text-xs">{hint}</div>}
        </div>
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

interface TooltipRow {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  dataKey?: string | number;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
  formatLabel,
}: {
  active?: boolean;
  payload?: readonly TooltipRow[];
  label?: string | number;
  formatValue: (v: number, key: string) => string;
  formatLabel?: (l: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium">{formatLabel ? formatLabel(String(label)) : label}</div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums">{formatValue(Number(p.value), String(p.dataKey))}</span>
        </div>
      ))}
    </div>
  );
}

/** Single-series area chart with crosshair tooltip. */
export function TrendAreaChart({
  data,
  xKey,
  yKey,
  name,
  height = 280,
  formatValue,
  formatX,
  color = "var(--color-chart-1)",
}: {
  data: object[];
  xKey: string;
  yKey: string;
  name: string;
  height?: number;
  formatValue: (v: number) => string;
  formatX?: (v: string) => string;
  color?: string;
}) {
  const gradId = `grad-${yKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          tickFormatter={formatX}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          tickFormatter={(v: number) => formatCompact(v)}
        />
        <Tooltip
          cursor={{ stroke: "var(--color-muted-foreground)", strokeDasharray: "3 3" }}
          content={(props) => (
            <ChartTooltip
              active={props.active}
              payload={props.payload as unknown as readonly TooltipRow[] | undefined}
              label={props.label as string | number | undefined}
              formatValue={(v) => formatValue(v)}
              formatLabel={formatX}
            />
          )}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  xKey,
  yKey,
  name,
  height = 260,
  formatValue = (v) => String(v),
  formatX,
  color = "var(--color-chart-1)",
}: {
  data: object[];
  xKey: string;
  yKey: string;
  name: string;
  height?: number;
  formatValue?: (v: number) => string;
  formatX?: (v: string) => string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          tickFormatter={formatX}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          allowDecimals={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          tickFormatter={(v: number) => formatCompact(v)}
        />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
          content={(props) => (
            <ChartTooltip
              active={props.active}
              payload={props.payload as unknown as readonly TooltipRow[] | undefined}
              label={props.label as string | number | undefined}
              formatValue={(v) => formatValue(v)}
              formatLabel={formatX}
            />
          )}
        />
        <Bar dataKey={yKey} name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
