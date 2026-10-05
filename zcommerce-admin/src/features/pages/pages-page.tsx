import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { TbEdit, TbExternalLink, TbFileText, TbPlus, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { usePermissions } from "@/hooks/use-auth";
import { useDeleteMutation, useListQuery } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { STORE_URL } from "@/lib/env";
import { formatDate } from "@/lib/format";
import type { CmsPage } from "@/types";

export function PagesPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const state = useTableState({ defaultSort: "title", defaultOrder: "asc", filterKeys: ["is_published"] });
  const { data, isLoading, isFetching } = useListQuery<CmsPage>("/pages", state.params);
  const del = useDeleteMutation("/pages", { successMessage: "Page deleted" });
  const confirm = useConfirmState<CmsPage>();

  const columns = useMemo<ColumnDef<CmsPage>[]>(
    () => [
      {
        accessorKey: "title",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Title" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
              <TbFileText className="size-5" />
            </div>
            <div>
              <div className="font-medium">{row.original.title}</div>
              <div className="text-muted-foreground text-xs">/pages/{row.original.slug}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "is_published",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.is_published ? "published" : "draft"} />,
      },
      {
        accessorKey: "show_in_footer",
        header: "Footer",
        cell: ({ row }) => (row.original.show_in_footer ? <StatusBadge status="active" label="Shown" variant="info" dot={false} /> : <span className="text-muted-foreground">—</span>),
      },
      {
        accessorKey: "updated_at",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Updated" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.updated_at)}</span>,
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <RowActions
            actions={[
              { label: can("pages.update") ? "Edit" : "View", icon: TbEdit, onClick: () => navigate(`/pages/${row.original.id}`) },
              { label: "View in store", icon: TbExternalLink, hidden: !row.original.is_published, onClick: () => window.open(`${STORE_URL}/pages/${row.original.slug}`, "_blank") },
              { label: "Delete", icon: TbTrash, destructive: true, separatorBefore: true, hidden: !can("pages.delete"), onClick: () => confirm.ask(row.original) },
            ]}
          />
        ),
      },
    ],
    [can, confirm, navigate],
  );

  return (
    <>
      <PageHeader
        title="Pages"
        description="Content pages such as About, Contact, Terms and Privacy."
        breadcrumbs={[{ label: "Store" }, { label: "Pages" }]}
        actions={
          <Can perm="pages.create">
            <Button asChild>
              <Link to="/pages/new">
                <TbPlus /> New page
              </Link>
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId="pages"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search pages…"
        filters={[
          {
            key: "is_published",
            label: "Status",
            options: [
              { value: "true", label: "Published" },
              { value: "false", label: "Draft" },
            ],
          },
        ]}
        onRowClick={(p) => navigate(`/pages/${p.id}`)}
        emptyTitle="No pages yet"
      />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete page?"
        description={`"${confirm.target?.title ?? ""}" will be permanently removed. Links to it will break.`}
        onConfirm={() => (confirm.target ? del.mutateAsync(confirm.target.id) : undefined)}
      />
    </>
  );
}
