import { NavLink } from "react-router";
import { TbBuildingStore, TbShieldCog } from "react-icons/tb";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePermissions } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { NavGroup } from "@/components/layout/nav-config";
import type { Scope } from "@/types";

export function Brand({ scope, collapsed, subtitle }: { scope: Scope; collapsed?: boolean; subtitle?: string }) {
  const Icon = scope === "system" ? TbShieldCog : TbBuildingStore;
  return (
    <div className={cn("flex h-14 items-center gap-2.5 border-b px-4", collapsed && "justify-center px-0")}>
      <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm">
        <Icon className="size-5" />
      </div>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold">zCommerce</div>
          <div className="text-muted-foreground truncate text-xs">
            {subtitle ?? (scope === "system" ? "Platform admin" : "Merchant admin")}
          </div>
        </div>
      )}
    </div>
  );
}

export function SidebarNav({
  groups,
  collapsed,
  onNavigate,
}: {
  groups: NavGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { can } = usePermissions();
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => can(i.perm)) }))
    .filter((g) => g.items.length > 0);

  return (
    <ScrollArea className="flex-1">
      <nav className={cn("flex flex-col gap-5 p-3", collapsed && "items-center px-2")}>
        {visibleGroups.map((g) => (
          <div key={g.label} className="flex w-full flex-col gap-0.5">
            {!collapsed ? (
              <div className="text-muted-foreground/80 mb-1 px-2.5 text-[11px] font-semibold tracking-wider uppercase">
                {g.label}
              </div>
            ) : (
              <div className="bg-border mx-auto mb-1 h-px w-6" />
            )}
            {g.items.map((item) => {
              const link = (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors",
                      collapsed && "w-10 justify-center px-0",
                      isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:bg-primary/20",
                    )
                  }
                >
                  <item.icon className="size-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
              return collapsed ? (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </div>
        ))}
      </nav>
    </ScrollArea>
  );
}
