import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import { TbEdit, TbLock, TbPlus, TbShieldLock, TbTrash } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { FormDialog } from "@/components/forms/form-dialog";
import { TextField } from "@/components/forms/fields";
import { PermissionMatrix } from "@/features/roles/permission-matrix";
import { usePermissions } from "@/hooks/use-auth";
import { useCreateMutation, useDeleteMutation, useGetQuery, useListQuery, useUpdateMutation } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { applyApiErrors } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { useScope } from "@/lib/scope";
import type { PermissionGroup, Role } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().max(255),
  permissions: z.array(z.string()),
});
type Values = z.infer<typeof schema>;

function RoleDialog({ open, onOpenChange, role }: { open: boolean; onOpenChange: (o: boolean) => void; role: Role | null }) {
  const { can } = usePermissions();
  const perms = useGetQuery<PermissionGroup[]>("/permissions");
  const create = useCreateMutation<Values>("/roles", { successMessage: "Role created" });
  const update = useUpdateMutation<Values>("/roles", { successMessage: "Role saved" });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", description: "", permissions: [] } });

  useEffect(() => {
    if (!open) return;
    form.reset({ name: role?.name ?? "", description: role?.description ?? "", permissions: role?.permissions ?? [] });
  }, [open, role, form]);

  const onSubmit = async (v: Values) => {
    try {
      if (role) await update.mutateAsync({ id: role.id, body: v });
      else await create.mutateAsync(v);
      onOpenChange(false);
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  const readOnly = role ? !can("roles.update") : false;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={role ? `Edit role: ${role.name}` : "New role"}
      description="Choose what members with this role can see and do."
      form={form}
      onSubmit={onSubmit}
      readOnly={readOnly}
      className="sm:max-w-3xl"
    >
      {role?.is_system && (
        <div className="bg-warning/10 text-foreground flex items-center gap-2 rounded-md border border-amber-300/40 px-3 py-2 text-sm">
          <TbLock className="size-4 text-amber-600" /> This is a built-in role. Changes affect every user assigned to it.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="name" label="Role name" placeholder="e.g. Fulfilment" />
        <TextField control={form.control} name="description" label="Description" placeholder="What is this role for?" />
      </div>
      <FormField
        control={form.control}
        name="permissions"
        render={({ field }) => (
          <PermissionMatrix groups={perms.data} loading={perms.isLoading} value={field.value} onChange={field.onChange} disabled={readOnly} />
        )}
      />
    </FormDialog>
  );
}

export function RolesPage() {
  const scope = useScope();
  const { can } = usePermissions();
  const state = useTableState({ defaultSort: "name", defaultOrder: "asc" });
  const { data, isLoading, isFetching } = useListQuery<Role>("/roles", state.params);
  const del = useDeleteMutation("/roles", { successMessage: "Role deleted" });
  const confirm = useConfirmState<Role>();
  const [editing, setEditing] = useState<Role | null>(null);
  const [open, setOpen] = useState(false);
  const edit = (r: Role | null) => {
    setEditing(r);
    setOpen(true);
  };

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: "name",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Role" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
              <TbShieldLock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-medium">
                {row.original.name}
                {row.original.is_system && <Badge variant="secondary">Built-in</Badge>}
              </div>
              {row.original.description && <div className="text-muted-foreground max-w-[320px] truncate text-xs">{row.original.description}</div>}
            </div>
          </div>
        ),
      },
      {
        id: "permissions",
        header: "Permissions",
        cell: ({ row }) =>
          row.original.permissions?.includes("*") ? (
            <Badge>Full access</Badge>
          ) : (
            <span className="tabular-nums">{row.original.permissions?.length ?? 0} permissions</span>
          ),
      },
      {
        accessorKey: "created_at",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Created" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>,
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <RowActions
            actions={[
              { label: can("roles.update") ? "Edit" : "View", icon: TbEdit, onClick: () => edit(row.original) },
              {
                label: "Delete",
                icon: TbTrash,
                destructive: true,
                hidden: !can("roles.delete") || row.original.is_system,
                onClick: () => confirm.ask(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [can, confirm],
  );

  return (
    <>
      <PageHeader
        title={scope === "system" ? "System roles" : "Roles"}
        description="Group permissions into roles and assign them to users."
        breadcrumbs={[{ label: scope === "system" ? "Administration" : "Team" }, { label: "Roles" }]}
        actions={
          <Can perm="roles.create">
            <Button onClick={() => edit(null)}>
              <TbPlus /> New role
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId={`${scope}-roles`}
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search roles…"
        onRowClick={edit}
        emptyTitle="No roles"
      />
      <RoleDialog open={open} onOpenChange={setOpen} role={editing} />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete role?"
        description={`"${confirm.target?.name ?? ""}" will be deleted. Users must be assigned another role first.`}
        onConfirm={() => (confirm.target ? del.mutateAsync(confirm.target.id) : undefined)}
      />
    </>
  );
}
