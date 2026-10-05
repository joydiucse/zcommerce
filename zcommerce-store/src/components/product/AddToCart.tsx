"use client";

import Link from "next/link";
import { useState } from "react";
import { FiCheck, FiLoader, FiShoppingBag } from "react-icons/fi";
import { useCart } from "@/components/providers/CartProvider";
import { QuantityInput } from "@/components/ui/QuantityInput";

export function AddToCart({
  productId,
  inStock,
  maxQuantity,
}: {
  productId: string;
  inStock: boolean;
  maxQuantity?: number;
}) {
  const { addItem, error } = useCart();
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<"idle" | "loading" | "added">("idle");
  const [failed, setFailed] = useState(false);

  if (!inStock) {
    return (
      <button type="button" className="btn btn-lg w-full bg-slate-200 text-slate-500" disabled>
        Out of stock
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <QuantityInput value={qty} onChange={setQty} max={maxQuantity && maxQuantity > 0 ? maxQuantity : undefined} />
        <button
          type="button"
          className="btn btn-primary btn-lg flex-1"
          disabled={state === "loading"}
          onClick={async () => {
            setState("loading");
            const ok = await addItem(productId, qty);
            setFailed(!ok);
            setState(ok ? "added" : "idle");
            if (ok) setTimeout(() => setState("idle"), 2000);
          }}
        >
          {state === "loading" ? (
            <FiLoader className="size-5 animate-spin" aria-hidden />
          ) : state === "added" ? (
            <FiCheck className="size-5" aria-hidden />
          ) : (
            <FiShoppingBag className="size-5" aria-hidden />
          )}
          {state === "added" ? "Added to cart" : "Add to cart"}
        </button>
      </div>
      {failed && error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <Link href="/checkout" className="btn btn-outline btn-lg w-full">
        Go to checkout
      </Link>
    </div>
  );
}
