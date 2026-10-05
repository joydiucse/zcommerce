"use client";

import Link from "next/link";
import { FiArrowLeft, FiShoppingBag } from "react-icons/fi";
import { useCart } from "@/components/providers/CartProvider";
import { useMoney, useStore } from "@/components/providers/StoreProvider";
import { CartLine } from "./CartLine";
import { CouponForm, Totals } from "./CartSummary";

export function CartView() {
  const { cart, loading, error } = useCart();
  const { checkout } = useStore();
  const money = useMoney();

  if (loading) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_24rem]" aria-busy="true">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton size-24" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="skeleton h-64" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-slate-100 text-slate-400">
          <FiShoppingBag className="size-9" aria-hidden />
        </span>
        <h2 className="mt-6 text-xl font-semibold text-slate-900">Your cart is empty</h2>
        <p className="mt-2 text-slate-500">Looks like you haven’t added anything yet.</p>
        <Link href="/products" className="btn btn-primary btn-lg mt-8">
          Start shopping
        </Link>
      </div>
    );
  }

  const belowMin = checkout.min_order_amount > 0 && cart.subtotal < checkout.min_order_amount;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
      <section aria-labelledby="cart-items-heading">
        <h2 id="cart-items-heading" className="sr-only">
          Items in your cart
        </h2>
        {error && (
          <p className="mb-4 rounded-field bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {cart.items.map((item) => (
            <CartLine key={item.id} item={item} />
          ))}
        </ul>
        <Link href="/products" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <FiArrowLeft className="size-4" aria-hidden /> Continue shopping
        </Link>
      </section>
      <aside aria-labelledby="summary-heading" className="h-fit space-y-5 rounded-card border border-slate-200 bg-slate-50 p-6 lg:sticky lg:top-24">
        <h2 id="summary-heading" className="text-lg font-semibold text-slate-900">
          Order summary
        </h2>
        <CouponForm />
        <Totals cart={cart} />
        {belowMin && (
          <p className="rounded-field bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
            The minimum order amount is {money(checkout.min_order_amount, cart.currency)}. Add{" "}
            {money(checkout.min_order_amount - cart.subtotal, cart.currency)} more to check out.
          </p>
        )}
        {belowMin ? (
          <button type="button" className="btn btn-primary btn-lg w-full" disabled>
            Proceed to checkout
          </button>
        ) : (
          <Link href="/checkout" className="btn btn-primary btn-lg w-full">
            Proceed to checkout
          </Link>
        )}
      </aside>
    </div>
  );
}
