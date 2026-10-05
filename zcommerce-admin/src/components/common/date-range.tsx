import { TbCalendar } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { daysAgo, toISODate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DateRangeValue {
  from?: string;
  to?: string;
}

const PRESETS: { label: string; days: number }[] = [
  { label: "7d", days: 6 },
  { label: "30d", days: 29 },
  { label: "90d", days: 89 },
];

export function DateRangeInput({
  value,
  onChange,
  presets = false,
  className,
}: {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  presets?: boolean;
  className?: string;
}) {
  const today = toISODate(new Date());
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative flex items-center gap-1.5">
        <TbCalendar className="text-muted-foreground pointer-events-none absolute left-2.5 size-4" />
        <Input
          type="date"
          aria-label="From date"
          className="h-8 w-[150px] pl-8 text-xs"
          value={value.from ?? ""}
          max={value.to || undefined}
          onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
        />
        <span className="text-muted-foreground text-xs">to</span>
        <Input
          type="date"
          aria-label="To date"
          className="h-8 w-[140px] text-xs"
          value={value.to ?? ""}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
        />
      </div>
      {presets && (
        <div className="flex gap-1">
          {PRESETS.map((p) => {
            const from = daysAgo(p.days);
            const active = value.from === from && value.to === today;
            return (
              <Button
                key={p.label}
                type="button"
                size="sm"
                variant={active ? "secondary" : "ghost"}
                className="h-8 px-2.5 text-xs"
                onClick={() => onChange({ from, to: today })}
              >
                {p.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
