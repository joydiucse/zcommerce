import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  TbArrowLeft,
  TbCircleCheck,
  TbCreditCard,
  TbLoader2,
  TbMail,
  TbNote,
  TbPhone,
  TbPhoto,
  TbPrinter,
  TbTruck,
  TbUser,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AddressBlock } from "@/components/common/address-block";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { SimpleTable } from "@/components/data-table/simple-table";
import { ORDER_STATUSES, PAYMENT_STATUSES, paymentMethodLabel } from "@/features/orders/constants";
import { usePermissions } from "@/hooks/use-auth";
import { useDetailQuery } from "@/hooks/use-resource";
import { useMoney } from "@/hooks/use-settings";
import { apiPut } from "@/lib/api";
import { toastError } from "@/lib/errors";
import { formatDateTime, humanize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus, Payment, PaymentStatus } from "@/types";

function useOrderMutations(id: string) {
  const qc = useQueryClient();
  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["tenant", "/orders"] }),
      qc.invalidateQueries({ queryKey: ["tenant", "/payments"] }),
      qc.invalidateQueries({ queryKey: ["tenant", "/dashboard"] }),
    ]);
  const status = useMutation({
    mutationFn: (body: { status: OrderStatus; note?: string; tracking_number?: string }) =>
      apiPut<Order>("tenant", `/orders/${id}/status`, body),
    onSuccess: async () => {
      await invalidate();
      toast.success("Order status updated");
    },
    onError: (e) => toastError(e),
  });
  const payment = useMutation({
    mutationFn: (payment_status: PaymentStatus) => apiPut<Order>("tenant", `/orders/${id}/payment-status`, { payment_status }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Payment status updated");
    },
    onError: (e) => toastError(e),
  });
  return { status, payment };
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between text-sm", strong && "text-base font-semibold", muted && "text-muted-foreground")}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const money = useMoney();
  const { can } = usePermissions();
  const { data: order, isLoading, isError } = useDetailQuery<Order>("/orders", id);
  const { status: statusMut, payment: paymentMut } = useOrderMutations(id);

  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState("");
  const [payStatus, setPayStatus] = useState<PaymentStatus>("pending");

  useEffect(() => {
    if (order) {
      setNewStatus(order.status);
      setTracking(order.tracking_number ?? "");
      setPayStatus(order.payment_status);
    }
  }, [order]);

  const fmt = (v: number | null | undefined) => money.format(v, order?.currency);

  const itemColumns = useMemo<ColumnDef<OrderItem>[]>(
    () => [
      {
        id: "product",
        header: "Product",
        cell: ({ row }) => {
          const it = row.original;
          const inner = (
            <div className="flex items-center gap-3">
              <div className="bg-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                {it.image_url ? <img src={it.image_url} alt="" className="size-full object-cover" /> : <TbPhoto className="text-muted-foreground" />}
              </div>
              <div className="min-w-0">
                <div className="max-w-[280px] truncate font-medium">{it.name}</div>
                <div className="text-muted-foreground text-xs">{it.sku || "—"}</div>
              </div>
            </div>
          );
          return it.product_id ? (
            <Link to={`/products/${it.product_id}`} className="hover:underline">
              {inner}
            </Link>
          ) : (
            inner
          );
        },
      },
      {
        id: "price",
        header: () => <div className="text-right">Price</div>,
        cell: ({ row }) => <div className="text-right tabular-nums">{fmt(row.original.unit_price)}</div>,
      },
      {
        id: "qty",
        header: () => <div className="text-right">Qty</div>,
        cell: ({ row }) => <div className="text-right tabular-nums">× {row.original.quantity}</div>,
      },
      {
        id: "total",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => <div className="text-right font-medium tabular-nums">{fmt(row.original.line_total)}</div>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [money, order?.currency],
  );

  const paymentColumns = useMemo<ColumnDef<Payment>[]>(
    () => [
      { accessorKey: "method", header: "Method", cell: ({ row }) => paymentMethodLabel(row.original.method) },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { accessorKey: "transaction_ref", header: "Reference", cell: ({ row }) => row.original.transaction_ref || "—" },
      { accessorKey: "paid_at", header: "Paid at", cell: ({ row }) => formatDateTime(row.original.paid_at) },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => <div className="text-right font-medium tabular-nums">{money.format(row.original.amount, row.original.currency)}</div>,
      },
    ],
    [money],
  );

  if (isError) {
    return (
      <EmptyState
        title="Order not found"
        action={
          <Button asChild variant="outline">
            <Link to="/orders">Back to orders</Link>
          </Button>
        }
      />
    );
  }

  const history = [...(order?.history ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const canUpdate = can("orders.update");
  const canPayment = can(["orders.update", "payments.update"]);

  return (
    <>
      <PageHeader
        title={
          isLoading || !order ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <span className="flex flex-wrap items-center gap-3">
              Order #{order.order_number}
              <StatusBadge status={order.status} className="text-xs" />
              <StatusBadge status={order.payment_status} label={`Payment ${order.payment_status}`} className="text-xs" />
            </span>
          )
        }
        description={order ? `Placed ${formatDateTime(order.placed_at ?? order.created_at)}` : undefined}
        breadcrumbs={[{ label: "Sales" }, { label: "Orders", to: "/orders" }, { label: order ? `#${order.order_number}` : "Order" }]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/orders">
                <TbArrowLeft /> Back
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <TbPrinter /> Print
            </Button>
          </>
        }
      />

      {isLoading || !order ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Items <StatusBadge status={order.fulfillment_status} />
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <SimpleTable columns={itemColumns} data={order.items} empty="No items" />
              </CardContent>
              <CardContent>
                <div className="ml-auto max-w-sm space-y-2 border-t pt-4">
                  <Row label="Subtotal" value={fmt(order.subtotal)} />
                  {Number(order.discount_total) > 0 && (
                    <Row label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`} value={`−${fmt(order.discount_total)}`} muted />
                  )}
                  <Row label={`Shipping${order.shipping_method_name ? ` · ${order.shipping_method_name}` : ""}`} value={fmt(order.shipping_total)} />
                  <Row label="Tax" value={fmt(order.tax_total)} />
                  <Separator />
                  <Row label="Total" value={fmt(order.grand_total)} strong />
                </div>
              </CardContent>
            </Card>

            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TbCreditCard className="text-muted-foreground" /> Payments
                </CardTitle>
                <CardDescription>Method: {paymentMethodLabel(order.payment_method)}</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <SimpleTable columns={paymentColumns} data={order.payments} empty="No payment records" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Status changes and notes</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No history recorded.</p>
                ) : (
                  <ol className="relative space-y-5 border-l pl-6">
                    {history.map((h, i) => (
                      <li key={h.id} className="relative">
                        <span
                          className={cn(
                            "ring-background absolute top-0.5 -left-[31px] flex size-4 items-center justify-center rounded-full ring-4",
                            i === 0 ? "bg-primary" : "bg-muted-foreground/40",
                          )}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={h.status} />
                          <span className="text-muted-foreground text-xs">{formatDateTime(h.created_at)}</span>
                          {(h.created_by_name ?? h.created_by_user?.name) && (
                            <span className="text-muted-foreground text-xs">by {h.created_by_name ?? h.created_by_user?.name}</span>
                          )}
                        </div>
                        {h.note && <p className="mt-1.5 text-sm">{h.note}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {canUpdate && (
              <Card>
                <CardHeader>
                  <CardTitle>Update status</CardTitle>
                  <CardDescription>Customers may be notified of changes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tracking">Tracking number</Label>
                    <Input id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. 1Z999AA10123456784" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Optional note for the timeline" />
                  </div>
                  <Button
                    className="w-full"
                    disabled={statusMut.isPending || (newStatus === order.status && !note && tracking === (order.tracking_number ?? ""))}
                    onClick={() =>
                      statusMut.mutate(
                        { status: newStatus, note: note || undefined, tracking_number: tracking || undefined },
                        { onSuccess: () => setNote("") },
                      )
                    }
                  >
                    {statusMut.isPending ? <TbLoader2 className="animate-spin" /> : <TbCircleCheck />}
                    Update status
                  </Button>
                </CardContent>
              </Card>
            )}

            {canPayment && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment status</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Select value={payStatus} onValueChange={(v) => setPayStatus(v as PaymentStatus)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    disabled={paymentMut.isPending || payStatus === order.payment_status}
                    onClick={() => paymentMut.mutate(payStatus)}
                  >
                    {paymentMut.isPending && <TbLoader2 className="animate-spin" />}
                    Save
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TbUser className="text-muted-foreground" /> Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {order.customer ? (
                  <Link to={`/customers/${order.customer.id}`} className="text-primary font-medium hover:underline">
                    {order.customer.name}
                  </Link>
                ) : (
                  <div className="font-medium">Guest checkout</div>
                )}
                <a href={`mailto:${order.email}`} className="hover:text-primary flex items-center gap-2">
                  <TbMail className="text-muted-foreground size-4" /> {order.email}
                </a>
                {order.phone && (
                  <div className="flex items-center gap-2">
                    <TbPhone className="text-muted-foreground size-4" /> {order.phone}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TbTruck className="text-muted-foreground" /> Shipping
                </CardTitle>
                {order.shipping_method_name && <CardDescription>{order.shipping_method_name}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                <AddressBlock address={order.shipping_address} />
                {order.tracking_number && (
                  <div className="bg-muted/60 rounded-md px-3 py-2 text-sm">
                    <span className="text-muted-foreground text-xs">Tracking</span>
                    <div className="font-mono font-medium">{order.tracking_number}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing address</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressBlock address={order.billing_address ?? order.shipping_address} empty="Same as shipping" />
              </CardContent>
            </Card>

            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TbNote className="text-muted-foreground" /> Customer note
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                </CardContent>
              </Card>
            )}
            {order.cancelled_at && (
              <p className="text-muted-foreground text-xs">
                {humanize(order.status)} on {formatDateTime(order.cancelled_at)}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
