"use client";

import { useState } from "react";
import { FiCheck, FiLoader, FiShoppingBag } from "react-icons/fi";
import { useCart } from "@/components/providers/CartProvider";

export function QuickAdd({ productId, name, inStock }: { productId: string; name: string; inStock: boolean }) {
  const { addItem } = useCart();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  if (!inStock) {
    return (
      <span className="block w-full rounded-brand bg-slate-100 py-2 text-center text-sm font-medium text-slate-500">Sold out</span>
    );
  }
  return (
    <button
      type="button"
      disabled={state === "loading"}
      onClick={async () => {
        setState("loading");
        const ok = await addItem(productId, 1);
        setState(ok ? "done" : "idle");
        if (ok) setTimeout(() => setState("idle"), 1500);
      }}
      className="btn btn-primary w-full py-2"
      aria-label={`Add ${name} to cart`}
    >
      {state === "loading" ? (
        <FiLoader className="size-4 animate-spin" aria-hidden />
      ) : state === "done" ? (
        <FiCheck className="size-4" aria-hidden />
      ) : (
        <FiShoppingBag className="size-4" aria-hidden />
      )}
      {state === "done" ? "Added" : "Add to cart"}
    </button>
  );
}
