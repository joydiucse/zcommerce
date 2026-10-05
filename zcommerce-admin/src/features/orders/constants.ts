import type { OrderStatus, PaymentStatus } from "@/types";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on delivery" },
  { value: "manual", label: "Manual / bank transfer" },
];

export function paymentMethodLabel(m: string | null | undefined) {
  return PAYMENT_METHODS.find((p) => p.value === m)?.label ?? m ?? "—";
}
