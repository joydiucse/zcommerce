"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPackage } from "react-icons/fi";
import { OrderDetails, StatusBadge } from "@/components/checkout/OrderDetails";
import { useMoney, useStore } from "@/components/providers/StoreProvider";
import { api, errorMessage } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import type { ApiMeta, Order } from "@/lib/types";

export function OrdersList() {
  const money = useMoney();
  const { locale } = useStore();
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api<Order[]>("/store/orders", { auth: true, query: { page, limit: 10 } })
      .then(({ data, meta }) => {
        if (cancelled) return;
        setOrders(Array.isArray(data) ? data : []);
        setMeta(meta ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (error) return <p className="rounded-field bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!orders)
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-20" />
        ))}
      </div>
    );
  if (!orders.length)
    return (
      <div className="rounded-card border border-dashed border-slate-300 py-14 text-center">
        <FiPackage className="mx-auto size-10 text-slate-300" aria-hidden />
        <p className="mt-3 font-medium text-slate-800">No orders yet</p>
        <Link href="/products" className="btn btn-primary mt-5">
          Start shopping
        </Link>
      </div>
    );

  return (
    <div>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-card border border-slate-200">
        {orders.map((o) => (
          <li key={o.id ?? o.order_number}>
            <Link href={`/account/orders/${encodeURIComponent(o.order_number)}`} className="flex items-center gap-4 p-4 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">Order #{o.order_number}</p>
                <p className="text-sm text-slate-500">
                  {formatDate(o.placed_at || o.created_at, locale)}
                  {Array.isArray(o.items) && o.items.length > 0 && ` · ${o.items.reduce((s, i) => s + i.quantity, 0)} items`}
                </p>
              </div>
              <StatusBadge status={o.status} />
              <span className="w-24 text-right font-semibold text-slate-900">{money(o.grand_total, o.currency)}</span>
              <FiChevronRight className="size-4 text-slate-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      {meta && meta.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <button type="button" className="btn btn-outline py-2" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-slate-500">
            Page {page} of {meta.total_pages}
          </span>
          <button type="button" className="btn btn-outline py-2" disabled={page >= meta.total_pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export function AccountOrder({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    api<Order | { order: Order }>(`/store/orders/${encodeURIComponent(orderNumber)}`, { auth: true })
      .then(({ data }) => {
        if (!cancelled) setOrder("order" in data ? data.order : data);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return (
    <div>
      <Link href="/account/orders" className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <FiChevronLeft className="size-4" aria-hidden /> All orders
      </Link>
      {error ? (
        <p className="rounded-field bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : order ? (
        <OrderDetails order={order} />
      ) : (
        <div className="space-y-3" aria-busy="true">
          <div className="skeleton h-8 w-1/2" />
          <div className="skeleton h-48" />
        </div>
      )}
    </div>
  );
}
