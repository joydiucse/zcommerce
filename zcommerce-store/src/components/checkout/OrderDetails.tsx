"use client";

import Image from "next/image";
import { useMoney, useStore } from "@/components/providers/StoreProvider";
import { formatDate, titleCase } from "@/lib/format";
import { imageProps } from "@/lib/images";
import type { Order } from "@/lib/types";
import { formatAddress } from "./AddressFields";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  processing: "bg-indigo-50 text-indigo-700",
  shipped: "bg-cyan-50 text-cyan-700",
  delivered: "bg-emerald-50 text-emerald-700",
  paid: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-600",
  refunded: "bg-slate-100 text-slate-600",
  failed: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? "bg-slate-100 text-slate-700"}`}>
      {titleCase(status)}
    </span>
  );
}

export function OrderDetails({ order }: { order: Order }) {
  const money = useMoney();
  const { locale, checkout } = useStore();
  const cur = order.currency;
  const shippingLines = formatAddress(order.shipping_address);
  const billingLines = formatAddress(order.billing_address);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
        <span>
          Order <strong className="text-slate-900">#{order.order_number}</strong>
        </span>
        {(order.placed_at || order.created_at) && <span>Placed {formatDate(order.placed_at || order.created_at, locale)}</span>}
        <span className="flex items-center gap-1.5">
          Status <StatusBadge status={order.status} />
        </span>
        <span className="flex items-center gap-1.5">
          Payment <StatusBadge status={order.payment_status} />
        </span>
      </div>

      {order.tracking_number && (
        <p className="rounded-field bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
          Tracking number: <strong>{order.tracking_number}</strong>
        </p>
      )}

      <div className="overflow-hidden rounded-card border border-slate-200">
        <ul className="divide-y divide-slate-100">
          {order.items.map((i, idx) => (
            <li key={`${i.sku}-${idx}`} className="flex items-center gap-4 p-4">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-field bg-slate-100">
                <Image {...imageProps(i.image_url)} alt={i.name} fill sizes="64px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-slate-900">{i.name}</span>
                <span className="text-sm text-slate-500">
                  {i.quantity} × {money(i.unit_price, cur)}
                  {i.sku ? ` · SKU ${i.sku}` : ""}
                </span>
              </span>
              <span className="font-semibold text-slate-900">{money(i.line_total, cur)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Subtotal</dt>
            <dd>{money(order.subtotal, cur)}</dd>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
              <dd>−{money(order.discount_total, cur)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-600">Shipping{order.shipping_method_name ? ` (${order.shipping_method_name})` : ""}</dt>
            <dd>{order.shipping_total ? money(order.shipping_total, cur) : "Free"}</dd>
          </div>
          {order.tax_total > 0 && (
            <div className="flex justify-between">
              <dt className="text-slate-600">Tax</dt>
              <dd>{money(order.tax_total, cur)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
            <dt>Total</dt>
            <dd>{money(order.grand_total, cur)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Shipping address</h3>
          <address className="mt-2 text-sm leading-relaxed text-slate-600 not-italic">
            {shippingLines.length ? shippingLines.map((l, i) => <div key={i}>{l}</div>) : "—"}
          </address>
        </div>
        <div className="rounded-card border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Billing address</h3>
          <address className="mt-2 text-sm leading-relaxed text-slate-600 not-italic">
            {billingLines.length ? billingLines.map((l, i) => <div key={i}>{l}</div>) : "Same as shipping"}
          </address>
        </div>
        <div className="rounded-card border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Payment & contact</h3>
          <p className="mt-2 text-sm text-slate-600">{order.payment_method === "cod" ? "Cash on delivery" : "Manual payment"}</p>
          <p className="text-sm break-all text-slate-600">{order.email}</p>
          {order.phone && <p className="text-sm text-slate-600">{order.phone}</p>}
        </div>
      </div>

      {order.payment_method === "manual" && order.payment_status === "pending" && checkout.manual_payment_instructions && (
        <div className="rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <h3 className="font-semibold">How to pay</h3>
          <p className="mt-1 whitespace-pre-line">{checkout.manual_payment_instructions}</p>
        </div>
      )}
      {order.notes && (
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">Notes:</span> {order.notes}
        </p>
      )}
    </div>
  );
}
