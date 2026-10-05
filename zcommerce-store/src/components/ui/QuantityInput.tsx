"use client";

import { FiMinus, FiPlus } from "react-icons/fi";

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max,
  disabled,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
}) {
  const clamp = (n: number) => Math.max(min, max ? Math.min(max, n) : n);
  const h = size === "sm" ? "h-8" : "h-11";
  const w = size === "sm" ? "w-8" : "w-11";
  return (
    <div className={`inline-flex items-center rounded-field border border-slate-300 bg-white ${h}`} role="group" aria-label={label}>
      <button
        type="button"
        className={`grid ${w} h-full place-items-center text-slate-600 hover:text-slate-900 disabled:opacity-40`}
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <FiMinus className="size-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className={`h-full ${size === "sm" ? "w-9 text-sm" : "w-12"} [appearance:textfield] border-x border-slate-200 text-center font-medium focus:outline-none [&::-webkit-inner-spin-button]:appearance-none`}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
      />
      <button
        type="button"
        className={`grid ${w} h-full place-items-center text-slate-600 hover:text-slate-900 disabled:opacity-40`}
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || (max !== undefined && value >= max)}
        aria-label="Increase quantity"
      >
        <FiPlus className="size-3.5" />
      </button>
    </div>
  );
}
