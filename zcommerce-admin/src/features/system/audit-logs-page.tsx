import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { TbFileDiff } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DateRangeInput } from "@/components/common/date-range";
import { JsonDiff } from "@/components/common/json-diff";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { useDebounce } from "@/hooks/use-debounce";
import { useAllQuery, useListQuery } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { formatDateTime } from "@/lib/format";
import type { AuditLog, Tenant } from "@/types";

function ActionBadge({ action }: { action: string }) {
  const verb = action.split(".").pop() ?? action;
  const variant = /delete|remove|suspend|void|cancel/.test(verb)
    ? "destructive"
    : /create|activate|paid/.test(verb)
      ? "success"
      : /update|change/.test(verb)
        ? "info"
        : "secondary";
  return (
    <Badge variant={variant} className="font-mono">
      {action}
    </Badge>
  );
}

export function AuditLogsPage() {
  const state = useTableState({ filterKeys: ["actor_type", "tenant_id", "action", "from", "to"] });
  const { data, isLoading, isFetching } = useListQuery<AuditLog>("/audit-logs", state.params);
  const tenants = useAllQuery<Tenant>("/tenants");
  const [viewing, setViewing] = useState<AuditLog | null>(null);
  const [action, setAction] = useState(state.filters.action ?? "");
  const debouncedAction = useDebounce(action, 400);
  const tenantName = useMemo(() => new Map((tenants.data ?? []).map((t) => [t.id, t.name])), [tenants.data]);

  useEffect(() => {
    if ((state.filters.action ?? "") !== debouncedAction) state.setFilter("action", debouncedAction || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAction]);

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: "created_at",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="When" />,
        cell: ({ row }) => <span className="text-muted-foreground text-xs">{formatDateTime(row.original.created_at)}</span>,
      },
      { accessorKey: "action", header: "Action", cell: ({ row }) => <ActionBadge action={row.original.action} /> },
      {
        id: "actor",
        header: "Actor",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.actor?.name ?? row.original.actor_id?.slice(0, 8) ?? "System"}</div>
            <div className="text-muted-foreground text-xs capitalize">{row.original.actor_type}</div>
          </div>
        ),
      },
      {
        id: "tenant",
        header: "Tenant",
        cell: ({ row }) =>
          row.original.tenant?.name ?? (row.original.tenant_id ? tenantName.get(row.original.tenant_id) ?? row.original.tenant_id.slice(0, 8) : <span className="text-muted-foreground">—</span>),
      },
      {
        id: "entity",
        header: "Entity",
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {row.original.entity_type ?? "—"}
            {row.original.entity_id ? `:${row.original.entity_id.slice(0, 8)}` : ""}
          </span>
        ),
      },
      { accessorKey: "ip", meta: { label: "IP" }, header: "IP", cell: ({ row }) => <span className="font-mono text-xs">{row.original.ip ?? "—"}</span> },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setViewing(row.original);
              }}
            >
              <TbFileDiff /> Changes
            </Button>
          </div>
        ),
      },
    ],
    [tenantName],
  );

  return (
    <>
      <PageHeader title="Audit logs" description="A tamper-evident trail of administrative actions." breadcrumbs={[{ label: "Administration" }, { label: "Audit logs" }]} />
      <DataTable
        tableId="audit-logs"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        hideSearch
        filters={[
          {
            key: "actor_type",
            label: "Actor",
            options: [
              { value: "system", label: "System user" },
              { value: "tenant", label: "Tenant user" },
            ],
          },
          { key: "tenant_id", label: "Tenant", options: (tenants.data ?? []).map((t) => ({ value: t.id, label: t.name })) },
        ]}
        toolbarExtra={
          <>
            <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Action, e.g. tenant.created" className="h-8 w-52" />
            <DateRangeInput value={{ from: state.filters.from, to: state.filters.to }} onChange={(v) => state.setFilters({ from: v.from, to: v.to })} />
          </>
        }
        onRowClick={setViewing}
        emptyTitle="No audit entries"
      />
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{viewing && <ActionBadge action={viewing.action} />}</DialogTitle>
            <DialogDescription>
              {viewing && formatDateTime(viewing.created_at)} · {viewing?.actor?.name ?? viewing?.actor_type}
              {viewing?.entity_type ? ` · ${viewing.entity_type}` : ""}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs">Entity ID</dt>
                  <dd className="font-mono text-xs break-all">{viewing.entity_id ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Tenant</dt>
                  <dd>{viewing.tenant?.name ?? (viewing.tenant_id ? tenantName.get(viewing.tenant_id) ?? viewing.tenant_id : "—")}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">IP address</dt>
                  <dd className="font-mono text-xs">{viewing.ip ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">User agent</dt>
                  <dd className="text-muted-foreground truncate text-xs" title={viewing.user_agent ?? ""}>
                    {viewing.user_agent ?? "—"}
                  </dd>
                </div>
              </dl>
              <JsonDiff changes={viewing.changes} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
