"use client";

import { useState } from "react";
import { FiTag, FiX } from "react-icons/fi";
import { useCart } from "@/components/providers/CartProvider";
import { useMoney } from "@/components/providers/StoreProvider";
import type { Cart } from "@/lib/types";

export function CouponForm() {
  const { cart, applyCoupon, removeCoupon, busy } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  if (!cart) return null;
  if (cart.coupon) {
    return (
      <div className="flex items-center justify-between rounded-field bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <span className="inline-flex items-center gap-2 font-medium">
          <FiTag className="size-4" aria-hidden /> {cart.coupon.code} applied
        </span>
        <button type="button" onClick={removeCoupon} disabled={busy} className="rounded p-1 hover:bg-emerald-100" aria-label={`Remove coupon ${cart.coupon.code}`}>
          <FiX className="size-4" />
        </button>
      </div>
    );
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        const err = await applyCoupon(code);
        setError(err ?? "");
        if (!err) setCode("");
      }}
    >
      <label htmlFor="coupon" className="label">
        Discount code
      </label>
      <div className="flex gap-2">
        <input
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. WELCOME10"
          className="input h-10 uppercase"
          aria-invalid={!!error}
          aria-describedby={error ? "coupon-error" : undefined}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-outline h-10 py-0" disabled={busy || !code.trim()}>
          Apply
        </button>
      </div>
      {error && (
        <p id="coupon-error" className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function Totals({ cart, shipping, showShippingPlaceholder = true }: { cart: Cart; shipping?: number | null; showShippingPlaceholder?: boolean }) {
  const money = useMoney();
  const cur = cart.currency;
  const shippingValue = shipping ?? cart.shipping_total;
  const grand = shipping !== undefined && shipping !== null ? cart.grand_total - cart.shipping_total + shipping : cart.grand_total;
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-slate-600">Subtotal</dt>
        <dd className="font-medium text-slate-900">{money(cart.subtotal, cur)}</dd>
      </div>
      {cart.discount_total > 0 && (
        <div className="flex justify-between text-emerald-700">
          <dt>Discount{cart.coupon ? ` (${cart.coupon.code})` : ""}</dt>
          <dd>−{money(cart.discount_total, cur)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-slate-600">Shipping</dt>
        <dd className="text-slate-900">
          {shipping === undefined && showShippingPlaceholder && !cart.shipping_total ? (
            <span className="text-slate-500">Calculated at checkout</span>
          ) : shippingValue === 0 ? (
            "Free"
          ) : (
            money(shippingValue, cur)
          )}
        </dd>
      </div>
      {cart.tax_total > 0 && (
        <div className="flex justify-between">
          <dt className="text-slate-600">Tax</dt>
          <dd className="text-slate-900">{money(cart.tax_total, cur)}</dd>
        </div>
      )}
      <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
        <dt className="font-semibold text-slate-900">Total</dt>
        <dd className="font-bold text-slate-900">{money(grand, cur)}</dd>
      </div>
    </dl>
  );
}
