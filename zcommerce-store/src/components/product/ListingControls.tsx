"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SORTS, listingHref, type ListingParams } from "@/lib/listing";

export function SortSelect({ basePath, params }: { basePath: string; params: ListingParams }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden sm:inline">Sort by</span>
      <select
        className="input h-10 w-auto py-0 pr-8 text-sm"
        value={params.sort}
        aria-busy={pending}
        onChange={(e) => start(() => router.push(listingHref(basePath, { ...params, sort: e.target.value, page: 1 })))}
        aria-label="Sort products"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PriceFilter({ basePath, params }: { basePath: string; params: ListingParams }) {
  const router = useRouter();
  const [min, setMin] = useState(params.min_price ?? "");
  const [max, setMax] = useState(params.max_price ?? "");
  const [pending, start] = useTransition();
  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    start(() =>
      router.push(listingHref(basePath, { ...params, min_price: min || undefined, max_price: max || undefined, page: 1 })),
    );
  };
  return (
    <form onSubmit={apply} className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="min_price">
          Minimum price
        </label>
        <input
          id="min_price"
          type="number"
          min={0}
          inputMode="decimal"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="input h-10 text-sm"
        />
        <span className="text-slate-400" aria-hidden>
          –
        </span>
        <label className="sr-only" htmlFor="max_price">
          Maximum price
        </label>
        <input
          id="max_price"
          type="number"
          min={0}
          inputMode="decimal"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="input h-10 text-sm"
        />
      </div>
      <button type="submit" className="btn btn-outline w-full py-2" disabled={pending}>
        {pending ? "Applying…" : "Apply"}
      </button>
    </form>
  );
}
