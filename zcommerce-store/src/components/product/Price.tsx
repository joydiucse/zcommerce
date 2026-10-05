"use client";

import { useMoney } from "@/components/providers/StoreProvider";

export function Money({ value, currency }: { value: number | null | undefined; currency?: string }) {
  const money = useMoney();
  return <>{money(value, currency)}</>;
}

export function Price({
  price,
  compareAt,
  size = "md",
}: {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const money = useMoney();
  const onSale = !!compareAt && compareAt > price;
  const main = size === "lg" ? "text-3xl" : size === "sm" ? "text-sm" : "text-base";
  const sub = size === "lg" ? "text-lg" : "text-sm";
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`${main} font-bold ${onSale ? "text-red-600" : "text-slate-900"}`}>
        <span className="sr-only">{onSale ? "Sale price " : "Price "}</span>
        {money(price)}
      </span>
      {onSale && (
        <s className={`${sub} text-slate-400`}>
          <span className="sr-only">Regular price </span>
          {money(compareAt)}
        </s>
      )}
    </p>
  );
}
