import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { TbBell, TbChecks } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkAllRead, useMarkRead, useRecentNotifications, useUnreadCount } from "@/features/notifications/api";
import { NotificationIcon, notificationLink } from "@/features/notifications/notification-icon";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const list = useRecentNotifications(open);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const count = unread.data?.count ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <TbBell className="size-5" />
          {count > 0 && (
            <span className="bg-destructive absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-muted-foreground text-xs">{count} unread</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            disabled={count === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <TbChecks /> Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-[380px]">
          {list.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : list.data?.data.length ? (
            <ul className="divide-y">
              {list.data.data.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cn(
                      "hover:bg-muted/60 flex w-full gap-3 px-4 py-3 text-left transition-colors",
                      !n.read_at && "bg-primary/[0.04]",
                    )}
                    onClick={() => {
                      if (!n.read_at) markRead.mutate(n.id);
                      const to = notificationLink(n);
                      if (to) {
                        setOpen(false);
                        navigate(to);
                      }
                    }}
                  >
                    <NotificationIcon type={n.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("truncate text-sm", !n.read_at && "font-semibold")}>{n.title}</p>
                        {!n.read_at && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />}
                      </div>
                      {n.body && <p className="text-muted-foreground line-clamp-2 text-xs">{n.body}</p>}
                      <p className="text-muted-foreground mt-0.5 text-[11px]">{formatRelative(n.created_at)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-10 text-sm">
              <TbBell className="size-6" />
              You're all caught up
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full" onClick={() => setOpen(false)}>
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
