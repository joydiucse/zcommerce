"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { api, errorMessage } from "@/lib/client-api";
import type { Order } from "@/lib/types";
import { OrderDetails } from "./OrderDetails";

export function OrderSuccess({ orderNumber, email }: { orderNumber: string; email: string }) {
  const { reset } = useCart();
  const { customer, ready } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  // The backend clears the cart on checkout; drop the local token too.
  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (!ready || !orderNumber) return;
    let cancelled = false;
    api<Order | { order: Order }>(`/store/orders/${encodeURIComponent(orderNumber)}`, {
      query: { email: email || undefined },
      auth: !!customer,
    })
      .then(({ data }) => {
        if (!cancelled) setOrder("order" in data ? data.order : data);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [orderNumber, email, ready, customer]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <FiCheckCircle className="mx-auto size-14 text-emerald-500" aria-hidden />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Thank you for your order!</h1>
        {orderNumber && (
          <p className="mt-2 text-slate-600">
            Your order <strong>#{orderNumber}</strong> has been placed.
            {email && <> A confirmation has been sent to {email}.</>}
          </p>
        )}
      </div>
      <div className="mt-10">
        {order ? (
          <OrderDetails order={order} />
        ) : error ? (
          <p className="text-center text-sm text-slate-500">We couldn’t load the order details right now ({error}).</p>
        ) : orderNumber ? (
          <div className="space-y-3" aria-busy="true">
            <div className="skeleton h-8 w-1/2" />
            <div className="skeleton h-48" />
            <div className="skeleton h-28" />
          </div>
        ) : null}
      </div>
      <div className="mt-10 flex justify-center gap-3">
        <Link href="/products" className="btn btn-primary">
          Continue shopping
        </Link>
        {customer && (
          <Link href="/account/orders" className="btn btn-outline">
            View my orders
          </Link>
        )}
      </div>
    </div>
  );
}
