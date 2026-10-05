import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  TbExternalLink,
  TbKey,
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarLeftExpand,
  TbLogout,
  TbMenu2,
  TbMoon,
  TbSearch,
  TbSun,
  TbUser,
} from "react-icons/tb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Brand, SidebarNav } from "@/components/layout/sidebar";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import type { NavGroup, NavItem } from "@/components/layout/nav-config";
import { useMe, usePermissions } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { logout } from "@/lib/api";
import { STORE_URL } from "@/lib/env";
import { cn, initials } from "@/lib/utils";
import type { Scope } from "@/types";

const COLLAPSE_KEY = "zc.sidebar.collapsed";

function GlobalSearch({ groups }: { groups: NavGroup[] }) {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const all: (NavItem & { group: string })[] = groups.flatMap((g) =>
      g.items.filter((i) => can(i.perm)).map((i) => ({ ...i, group: g.label })),
    );
    const term = q.trim().toLowerCase();
    return term ? all.filter((i) => i.label.toLowerCase().includes(term) || i.group.toLowerCase().includes(term)) : all;
  }, [groups, can, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    navigate(to);
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
  };

  return (
    <Popover open={open && items.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative hidden w-full max-w-sm md:block">
          <TbSearch className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(items.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter" && items[active]) {
                go(items[active].to);
              } else if (e.key === "Escape") {
                setOpen(false);
                inputRef.current?.blur();
              }
            }}
            placeholder="Jump to…"
            className="bg-muted/60 placeholder:text-muted-foreground focus:bg-background focus:ring-ring/40 h-9 w-full rounded-md border border-transparent pr-14 pl-9 text-sm outline-none focus:border-ring focus:ring-[3px]"
          />
          <kbd className="text-muted-foreground bg-background pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px]">
            Ctrl K
          </kbd>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) max-w-sm p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {items.map((i, idx) => (
          <button
            key={i.to}
            type="button"
            onMouseEnter={() => setActive(idx)}
            onClick={() => go(i.to)}
            className={cn(
              "flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-sm",
              idx === active && "bg-accent",
            )}
          >
            <i.icon className="text-muted-foreground size-4" />
            <span className="flex-1">{i.label}</span>
            <span className="text-muted-foreground text-xs">{i.group}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function UserMenu({ scope }: { scope: Scope }) {
  const me = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = me.data?.user;
  const base = scope === "system" ? "/system" : "";

  const doLogout = async () => {
    await logout(scope);
    qc.removeQueries({ queryKey: [scope] });
    navigate(`/login?scope=${scope === "system" ? "platform" : "merchant"}`, { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors md:rounded-md md:p-1 md:pr-2"
        >
          <Avatar className="size-8">
            {user?.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
            <AvatarFallback>{initials(user?.name)}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left leading-tight md:block">
            <div className="max-w-[140px] truncate text-sm font-medium">{user?.name ?? "…"}</div>
            <div className="text-muted-foreground max-w-[140px] truncate text-xs">{user?.role?.name ?? user?.email}</div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">{user?.name}</div>
          <div className="text-muted-foreground truncate text-xs">{user?.email}</div>
          {me.data?.tenant && (
            <div className="text-muted-foreground mt-1 truncate text-xs">
              Store: <span className="text-foreground">{me.data.tenant.name}</span>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`${base}/profile`)}>
          <TbUser /> Profile
        </DropdownMenuItem>
        {scope === "tenant" && (
          <DropdownMenuItem onClick={() => navigate("/profile?tab=password")}>
            <TbKey /> Change password
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={doLogout}>
          <TbLogout /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" title="Toggle theme">
      {resolved === "dark" ? <TbSun className="size-5" /> : <TbMoon className="size-5" />}
    </Button>
  );
}

export function AppShell({ scope, nav }: { scope: Scope; nav: NavGroup[] }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const me = useMe();

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const subtitle = scope === "tenant" ? me.data?.tenant?.name : undefined;

  return (
    <div className="bg-muted/30 flex min-h-screen dark:bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground sticky top-0 hidden h-screen shrink-0 flex-col border-r transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        <Brand scope={scope} collapsed={collapsed} subtitle={subtitle} />
        <SidebarNav groups={nav} collapsed={collapsed} />
        <div className={cn("border-t p-3", collapsed && "flex justify-center px-2")}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className={cn(!collapsed && "w-full justify-start")}
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <TbLayoutSidebarLeftExpand className="size-5" /> : <TbLayoutSidebarLeftCollapse className="size-5" />}
            {!collapsed && "Collapse"}
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="bg-sidebar w-72 gap-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main navigation</SheetDescription>
          <Brand scope={scope} subtitle={subtitle} />
          <SidebarNav groups={nav} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/85 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-5">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <TbMenu2 className="size-5" />
          </Button>
          <GlobalSearch groups={nav} />
          <div className="ml-auto flex items-center gap-1">
            {scope === "tenant" && (
              <Button asChild variant="outline" size="sm" className="mr-1 hidden sm:inline-flex">
                <a href={STORE_URL} target="_blank" rel="noreferrer">
                  <TbExternalLink /> View store
                </a>
              </Button>
            )}
            {scope === "system" && (
              <Button asChild variant="ghost" size="sm" className="mr-1 hidden sm:inline-flex">
                <Link to="/">Merchant admin</Link>
              </Button>
            )}
            {scope === "tenant" && <NotificationsBell />}
            <ThemeToggle />
            <div className="bg-border mx-1 h-6 w-px" />
            <UserMenu scope={scope} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
