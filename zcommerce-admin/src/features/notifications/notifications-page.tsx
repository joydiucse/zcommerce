import { useMemo } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { TbCheck, TbChecks, TbExternalLink } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { useMarkAllRead, useMarkRead, useUnreadCount } from "@/features/notifications/api";
import { NotificationIcon, notificationLink } from "@/features/notifications/notification-icon";
import { useListQuery } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { formatDateTime, formatRelative, humanize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types";

export function NotificationsPage() {
  const navigate = useNavigate();
  const state = useTableState({ filterKeys: ["unread", "type"] });
  const { data, isLoading, isFetching } = useListQuery<AppNotification>("/notifications", state.params);
  const unread = useUnreadCount();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const columns = useMemo<ColumnDef<AppNotification>[]>(
    () => [
      {
        id: "notification",
        header: "Notification",
        enableHiding: false,
        cell: ({ row }) => {
          const n = row.original;
          return (
            <div className="flex max-w-[560px] items-start gap-3 whitespace-normal">
              <NotificationIcon type={n.type} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm", !n.read_at && "font-semibold")}>{n.title}</span>
                  {!n.read_at && <span className="bg-primary size-2 rounded-full" />}
                </div>
                {n.body && <p className="text-muted-foreground text-sm">{n.body}</p>}
              </div>
            </div>
          );
        },
      },
      { accessorKey: "type", header: "Type", cell: ({ row }) => <span className="text-muted-foreground text-xs">{humanize(row.original.type)}</span> },
      {
        accessorKey: "created_at",
        header: "Received",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs" title={formatDateTime(row.original.created_at)}>
            {formatRelative(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => {
          const n = row.original;
          const link = notificationLink(n);
          return (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {link && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!n.read_at) markRead.mutate(n.id);
                    navigate(link);
                  }}
                >
                  <TbExternalLink /> Open
                </Button>
              )}
              {!n.read_at && (
                <Button variant="outline" size="sm" disabled={markRead.isPending} onClick={() => markRead.mutate(n.id)}>
                  <TbCheck /> Mark read
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [markRead, navigate],
  );

  return (
    <>
      <PageHeader
        title="Notifications"
        description={`${unread.data?.count ?? 0} unread notifications`}
        breadcrumbs={[{ label: "Team" }, { label: "Notifications" }]}
        actions={
          <Button variant="outline" disabled={!unread.data?.count || markAll.isPending} onClick={() => markAll.mutate()}>
            <TbChecks /> Mark all as read
          </Button>
        }
      />
      <DataTable
        tableId="notifications"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        hideSearch
        filters={[{ key: "unread", label: "Show", options: [{ value: "true", label: "Unread only" }] }]}
        emptyTitle="No notifications"
        emptyDescription="You're all caught up."
      />
    </>
  );
}
