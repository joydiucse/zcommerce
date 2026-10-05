"use client";

import Link from "next/link";
import { FiShoppingBag, FiUser } from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";

export function AccountButton() {
  const { customer, ready } = useAuth();
  const label = customer ? `My account (${customer.name})` : "Sign in";
  return (
    <Link
      href={customer ? "/account" : "/account/login"}
      className="inline-flex items-center gap-2 rounded-full p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      aria-label={label}
      title={label}
    >
      <FiUser className="size-5" aria-hidden />
      <span className="hidden max-w-28 truncate text-sm font-medium xl:inline">
        {ready && customer ? customer.name.split(" ")[0] : "Account"}
      </span>
    </Link>
  );
}

export function CartButton() {
  const { itemCount, setDrawerOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className="relative inline-flex items-center rounded-full p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
      aria-haspopup="dialog"
    >
      <FiShoppingBag className="size-5" aria-hidden />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] leading-5 font-bold text-primary-fg">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}
