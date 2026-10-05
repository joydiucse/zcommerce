import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAP: Record<string, BadgeVariant> = {
  // generic
  active: "success",
  enabled: "success",
  published: "success",
  disabled: "muted",
  inactive: "muted",
  draft: "muted",
  archived: "secondary",
  // tenants / subscriptions
  trial: "info",
  trialing: "info",
  suspended: "destructive",
  past_due: "warning",
  canceled: "muted",
  // invoices
  open: "warning",
  paid: "success",
  void: "muted",
  // orders
  pending: "warning",
  confirmed: "info",
  processing: "purple",
  shipped: "info",
  delivered: "success",
  cancelled: "destructive",
  refunded: "secondary",
  failed: "destructive",
  unfulfilled: "muted",
  fulfilled: "success",
  // reviews
  approved: "success",
  rejected: "destructive",
  // stock
  in: "success",
  low: "warning",
  out: "destructive",
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "destructive",
  // inventory movement
  adjustment: "secondary",
  sale: "info",
  return: "purple",
  restock: "success",
};

const DOT: Partial<Record<BadgeVariant, string>> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-sky-500",
  purple: "bg-violet-500",
  muted: "bg-muted-foreground/60",
  secondary: "bg-muted-foreground/60",
};

export function StatusBadge({
  status,
  label,
  variant,
  className,
  dot = true,
}: {
  status: string | null | undefined;
  label?: string;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const v = variant ?? MAP[status] ?? "outline";
  return (
    <Badge variant={v} className={cn("capitalize", className)}>
      {dot && DOT[v] && <span className={cn("size-1.5 rounded-full", DOT[v])} />}
      {label ?? humanize(status)}
    </Badge>
  );
}

export function BoolBadge({ value, yes = "Active", no = "Inactive" }: { value: boolean; yes?: string; no?: string }) {
  return <StatusBadge status={value ? "active" : "inactive"} label={value ? yes : no} />;
}
