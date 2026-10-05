"use client";

import Image from "next/image";
import Link from "next/link";
import { FiTrash2 } from "react-icons/fi";
import { useCart } from "@/components/providers/CartProvider";
import { useMoney } from "@/components/providers/StoreProvider";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { imageProps } from "@/lib/images";
import type { CartItem } from "@/lib/types";

export function CartLine({ item, compact = false, onNavigate }: { item: CartItem; compact?: boolean; onNavigate?: () => void }) {
  const { updateItem, removeItem, busy, cart } = useCart();
  const money = useMoney();
  const max = item.max_quantity > 0 ? item.max_quantity : undefined;
  return (
    <li className="flex gap-4 py-4">
      <Link
        href={`/products/${item.slug}`}
        onClick={onNavigate}
        className={`relative shrink-0 overflow-hidden rounded-card bg-slate-100 ${compact ? "size-20" : "size-24 sm:size-28"}`}
      >
        <Image {...imageProps(item.image_url)} alt={item.name} fill sizes="112px" className="object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/products/${item.slug}`} onClick={onNavigate} className="line-clamp-2 font-medium text-slate-900 hover:text-primary">
              {item.name}
            </Link>
            <p className="mt-0.5 text-sm text-slate-500">{money(item.price, cart?.currency)}</p>
            {!item.in_stock && <p className="mt-1 text-xs font-medium text-red-600">Out of stock</p>}
          </div>
          <p className="shrink-0 font-semibold text-slate-900">{money(item.line_total, cart?.currency)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityInput
            size="sm"
            value={item.quantity}
            max={max}
            disabled={busy}
            onChange={(q) => q !== item.quantity && updateItem(item.id, q)}
            label={`Quantity for ${item.name}`}
          />
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 disabled:opacity-50"
            aria-label={`Remove ${item.name} from cart`}
          >
            <FiTrash2 className="size-4" aria-hidden />
            <span className={compact ? "sr-only" : ""}>Remove</span>
          </button>
        </div>
      </div>
    </li>
  );
}
