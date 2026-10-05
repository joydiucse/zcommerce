import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { TbDots } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface RowAction {
  label: string;
  icon?: IconType;
  onClick: () => void;
  destructive?: boolean;
  hidden?: boolean;
  separatorBefore?: boolean;
}

export function RowActions({ actions, children }: { actions: RowAction[]; children?: ReactNode }) {
  const visible = actions.filter((a) => !a.hidden);
  if (!visible.length && !children) return null;
  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Row actions">
            <TbDots />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {children}
          {visible.map((a) => (
            <div key={a.label}>
              {a.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem variant={a.destructive ? "destructive" : "default"} onClick={a.onClick}>
                {a.icon && <a.icon />}
                {a.label}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
