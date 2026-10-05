import { TbAlertTriangle, TbBell, TbShoppingCart, TbStar, TbUser } from "react-icons/tb";
import { cn } from "@/lib/utils";

export function NotificationIcon({ type, className }: { type: string; className?: string }) {
  const [Icon, tone] = type.startsWith("order")
    ? [TbShoppingCart, "bg-sky-500/12 text-sky-600 dark:text-sky-300"]
    : type.startsWith("stock")
      ? [TbAlertTriangle, "bg-warning/15 text-amber-600 dark:text-warning"]
      : type.startsWith("review")
        ? [TbStar, "bg-violet-500/12 text-violet-600 dark:text-violet-300"]
        : type.startsWith("customer")
          ? [TbUser, "bg-success/12 text-success"]
          : [TbBell, "bg-muted text-muted-foreground"];
  return (
    <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", tone, className)}>
      <Icon className="size-4" />
    </div>
  );
}

/** Best-effort deep link for a notification payload. */
export function notificationLink(n: { type: string; data: Record<string, unknown> | null }): string | null {
  const d = n.data ?? {};
  const orderId = typeof d.order_id === "string" ? d.order_id : null;
  const productId = typeof d.product_id === "string" ? d.product_id : null;
  if (orderId) return `/orders/${orderId}`;
  if (productId) return n.type.startsWith("stock") ? `/inventory?search=${encodeURIComponent(String(d.sku ?? ""))}` : `/products/${productId}`;
  if (n.type.startsWith("review")) return "/reviews";
  return null;
}
