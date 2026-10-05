import type { Table } from "@tanstack/react-table";
import { TbAdjustmentsHorizontal } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { humanize } from "@/lib/format";

export function DataTableViewOptions<T>({ table }: { table: Table<T> }) {
  const cols = table.getAllColumns().filter((c) => c.getCanHide() && c.id !== "actions");
  if (!cols.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <TbAdjustmentsHorizontal /> View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {cols.map((c) => {
          const label = (c.columnDef.meta as { label?: string } | undefined)?.label ?? humanize(c.id);
          return (
            <DropdownMenuCheckboxItem
              key={c.id}
              checked={c.getIsVisible()}
              onCheckedChange={(v) => c.toggleVisibility(!!v)}
              onSelect={(e) => e.preventDefault()}
            >
              {label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
