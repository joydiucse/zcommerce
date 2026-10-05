import { useEffect, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { useMoney } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  symbol?: string;
  allowNull?: boolean;
};

/** Numeric money input with currency symbol prefix; emits a number (2 decimals) or null. */
export function MoneyInput({ value, onChange, symbol, allowNull = false, className, onBlur, ...rest }: Props) {
  const money = useMoney();
  const sym = symbol ?? money.symbol;
  const [text, setText] = useState(value === null || value === undefined ? "" : String(value));

  useEffect(() => {
    const parsed = text === "" ? null : Number(text);
    if (parsed !== (value ?? null)) setText(value === null || value === undefined ? "" : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      {sym && (
        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm">
          {sym}
        </span>
      )}
      <Input
        {...rest}
        type="text"
        inputMode="decimal"
        className={cn("tabular-nums", sym && "pl-8", sym.length > 1 && "pl-11", className)}
        value={text}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, "");
          const normalized = raw.split(".").length > 2 ? text : raw;
          setText(normalized);
          if (normalized === "") onChange(allowNull ? null : 0);
          else if (!Number.isNaN(Number(normalized))) onChange(Number(normalized));
        }}
        onBlur={(e) => {
          if (text !== "" && !Number.isNaN(Number(text))) {
            const fixed = Math.round(Number(text) * 100) / 100;
            setText(fixed.toFixed(2));
            onChange(fixed);
          }
          onBlur?.(e);
        }}
      />
    </div>
  );
}
