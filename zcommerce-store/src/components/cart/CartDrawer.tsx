"use client";

import Link from "next/link";
import { FiShoppingBag } from "react-icons/fi";
import { useCart } from "@/components/providers/CartProvider";
import { useMoney } from "@/components/providers/StoreProvider";
import { Drawer } from "@/components/ui/Drawer";
import { CartLine } from "./CartLine";

export function CartDrawer() {
  const { cart, drawerOpen, setDrawerOpen, itemCount, error } = useCart();
  const money = useMoney();
  const close = () => setDrawerOpen(false);
  const empty = !cart || cart.items.length === 0;
  return (
    <Drawer
      open={drawerOpen}
      onClose={close}
      title={`Your cart${itemCount ? ` (${itemCount})` : ""}`}
      footer={
        !empty && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-base">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-900">{money(cart.subtotal, cart.currency)}</span>
            </div>
            <p className="text-xs text-slate-500">Shipping, taxes and discounts are calculated at checkout.</p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/cart" onClick={close} className="btn btn-outline">
                View cart
              </Link>
              <Link href="/checkout" onClick={close} className="btn btn-primary">
                Checkout
              </Link>
            </div>
          </div>
        )
      }
    >
      {error && <p className="mx-5 mt-4 rounded-field bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      {empty ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-slate-100 text-slate-400">
            <FiShoppingBag className="size-7" aria-hidden />
          </span>
          <p className="text-slate-600">Your cart is empty.</p>
          <Link href="/products" onClick={close} className="btn btn-primary">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 px-5">
          {cart.items.map((item) => (
            <CartLine key={item.id} item={item} compact onNavigate={close} />
          ))}
        </ul>
      )}
    </Drawer>
  );
}
