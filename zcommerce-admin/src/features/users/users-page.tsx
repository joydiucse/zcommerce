import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import { TbEdit, TbPlus, TbTrash } from "react-icons/tb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { FormDialog } from "@/components/forms/form-dialog";
import { ImageField, SelectField, TextField } from "@/components/forms/fields";
import { useMe, usePermissions } from "@/hooks/use-auth";
import { useAllQuery, useCreateMutation, useDeleteMutation, useListQuery, useUpdateMutation } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { applyApiErrors } from "@/lib/errors";
import { formatDate, formatRelative } from "@/lib/format";
import { useScope } from "@/lib/scope";
import { initials } from "@/lib/utils";
import type { Role, StaffUser } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  role_id: z.string().nullable().refine((v) => !!v, "Select a role"),
  status: z.enum(["active", "disabled"]),
  avatar_url: z.string().nullable(),
  password: z.string(),
});
type Values = z.infer<typeof schema>;

function UserDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user: StaffUser | null }) {
  const scope = useScope();
  const { can } = usePermissions();
  const roles = useAllQuery<Role>("/roles");
  const create = useCreateMutation<Record<string, unknown>>("/users", { successMessage: "User created" });
  const update = useUpdateMutation<Record<string, unknown>>("/users", { successMessage: "User saved" });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", role_id: null, status: "active", avatar_url: null, password: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: user?.name ?? "",
      email: user?.email ?? "",
      role_id: user?.role_id ?? user?.role?.id ?? null,
      status: user?.status ?? "active",
      avatar_url: user?.avatar_url ?? null,
      password: "",
    });
  }, [open, user, form]);

  const onSubmit = async (v: Values) => {
    if (!user && v.password.length < 8) {
      form.setError("password", { message: "At least 8 characters" });
      return;
    }
    if (user && v.password && v.password.length < 8) {
      form.setError("password", { message: "At least 8 characters" });
      return;
    }
    const { password, avatar_url, ...rest } = v;
    const body: Record<string, unknown> = { ...rest };
    if (scope === "tenant") body.avatar_url = avatar_url;
    if (password) body.password = password;
    try {
      if (user) await update.mutateAsync({ id: user.id, body });
      else await create.mutateAsync(body);
      onOpenChange(false);
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={user ? "Edit user" : "Invite user"}
      form={form}
      onSubmit={onSubmit}
      readOnly={user ? !can("users.update") : false}
    >
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        {scope === "tenant" ? (
          <ImageField control={form.control} name="avatar_url" label="Avatar" aspect="aspect-square" />
        ) : (
          <div className="hidden sm:block" />
        )}
        <div className="space-y-4">
          <TextField control={form.control} name="name" label="Full name" />
          <TextField control={form.control} name="email" label="Email" type="email" autoComplete="off" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          control={form.control}
          name="role_id"
          label="Role"
          placeholder={roles.isLoading ? "Loading…" : "Select a role"}
          options={(roles.data ?? []).map((r) => ({ value: r.id, label: r.name }))}
        />
        <SelectField
          control={form.control}
          name="status"
          label="Status"
          options={[
            { value: "active", label: "Active" },
            { value: "disabled", label: "Disabled" },
          ]}
        />
      </div>
      <TextField
        control={form.control}
        name="password"
        type="password"
        autoComplete="new-password"
        label={user ? "New password" : "Password"}
        description={user ? "Leave blank to keep the current password." : "At least 8 characters."}
      />
    </FormDialog>
  );
}

export function UsersPage() {
  const scope = useScope();
  const { can } = usePermissions();
  const me = useMe();
  const state = useTableState({ filterKeys: ["status", "role_id"] });
  const { data, isLoading, isFetching } = useListQuery<StaffUser>("/users", state.params);
  const roles = useAllQuery<Role>("/roles");
  const del = useDeleteMutation("/users", { successMessage: "User deleted" });
  const confirm = useConfirmState<StaffUser>();
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [open, setOpen] = useState(false);
  const edit = (u: StaffUser | null) => {
    setEditing(u);
    setOpen(true);
  };
  const myId = me.data?.user.id;
  const roleName = useMemo(() => new Map((roles.data ?? []).map((r) => [r.id, r.name])), [roles.data]);

  const columns = useMemo<ColumnDef<StaffUser>[]>(
    () => [
      {
        accessorKey: "name",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="User" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar>
              {row.original.avatar_url && <AvatarImage src={row.original.avatar_url} alt="" />}
              <AvatarFallback>{initials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 font-medium">
                {row.original.name}
                {row.original.id === myId && <Badge variant="secondary">You</Badge>}
              </div>
              <div className="text-muted-foreground text-xs">{row.original.email}</div>
            </div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => {
          const name = row.original.role?.name ?? (row.original.role_id ? roleName.get(row.original.role_id) : undefined);
          return name ? <Badge variant="outline">{name}</Badge> : <span className="text-muted-foreground">—</span>;
        },
      },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        accessorKey: "last_login_at",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Last login" />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.last_login_at ? formatRelative(row.original.last_login_at) : "Never"}</span>,
      },
      {
        accessorKey: "created_at",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Added" />,
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>,
      },
      {
        id: "actions",
        enableHiding: false,
        header: "",
        cell: ({ row }) => (
          <RowActions
            actions={[
              { label: can("users.update") ? "Edit" : "View", icon: TbEdit, onClick: () => edit(row.original) },
              {
                label: "Delete",
                icon: TbTrash,
                destructive: true,
                hidden: !can("users.delete") || row.original.id === myId,
                onClick: () => confirm.ask(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [can, confirm, myId, roleName],
  );

  const title = scope === "system" ? "System users" : "Staff";

  return (
    <>
      <PageHeader
        title={title}
        description={scope === "system" ? "Platform administrators with access to this console." : "Team members who can access your store admin."}
        breadcrumbs={[{ label: scope === "system" ? "Administration" : "Team" }, { label: title }]}
        actions={
          <Can perm="users.create">
            <Button onClick={() => edit(null)}>
              <TbPlus /> Add user
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId={`${scope}-users`}
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search name or email…"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "disabled", label: "Disabled" },
            ],
          },
          { key: "role_id", label: "Role", options: (roles.data ?? []).map((r) => ({ value: r.id, label: r.name })) },
        ]}
        onRowClick={edit}
        emptyTitle="No users"
      />
      <UserDialog open={open} onOpenChange={setOpen} user={editing} />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete user?"
        description={`${confirm.target?.name ?? ""} will lose access immediately.`}
        onConfirm={() => (confirm.target ? del.mutateAsync(confirm.target.id) : undefined)}
      />
    </>
  );
}
