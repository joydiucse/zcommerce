import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import { TbEdit, TbPlus, TbTag, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { BoolBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { FormDialog } from "@/components/forms/form-dialog";
import { ImageField, SwitchField, TextareaField, TextField } from "@/components/forms/fields";
import { usePermissions } from "@/hooks/use-auth";
import { useCreateMutation, useDeleteMutation, useListQuery, useUpdateMutation } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { applyApiErrors } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { slugify } from "@/lib/utils";
import type { Brand } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and dashes only"),
  description: z.string(),
  logo_url: z.string().nullable(),
  is_active: z.boolean(),
  meta_title: z.string().max(70),
  meta_description: z.string().max(170),
});
type Values = z.infer<typeof schema>;

const empty: Values = {
  name: "",
  slug: "",
  description: "",
  logo_url: null,
  is_active: true,
  meta_title: "",
  meta_description: "",
};

function BrandDialog({ open, onOpenChange, brand }: { open: boolean; onOpenChange: (o: boolean) => void; brand: Brand | null }) {
  const { can } = usePermissions();
  const create = useCreateMutation<Values>("/brands", { successMessage: "Brand created" });
  const update = useUpdateMutation<Values>("/brands", { successMessage: "Brand saved" });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const slugTouched = useRef(false);

  useEffect(() => {
    if (!open) return;
    slugTouched.current = !!brand;
    form.reset(
      brand
        ? {
            name: brand.name,
            slug: brand.slug,
            description: brand.description ?? "",
            logo_url: brand.logo_url,
            is_active: brand.is_active,
            meta_title: brand.meta_title ?? "",
            meta_description: brand.meta_description ?? "",
          }
        : empty,
    );
  }, [open, brand, form]);

  const onSubmit = async (v: Values) => {
    const body = { ...v, slug: v.slug || slugify(v.name) };
    try {
      if (brand) await update.mutateAsync({ id: brand.id, body });
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
      title={brand ? "Edit brand" : "New brand"}
      form={form}
      onSubmit={onSubmit}
      readOnly={brand ? !can("brands.update") : false}
      className="sm:max-w-2xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          control={form.control}
          name="name"
          label="Name"
          onValueChange={(v) => !slugTouched.current && form.setValue("slug", slugify(v))}
        />
        <TextField control={form.control} name="slug" label="Slug" onValueChange={() => (slugTouched.current = true)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <ImageField control={form.control} name="logo_url" label="Logo" aspect="aspect-square" contain />
        <div className="space-y-4">
          <TextareaField control={form.control} name="description" label="Description" rows={4} />
          <SwitchField control={form.control} name="is_active" label="Active" />
        </div>
      </div>
      <div className="space-y-4 rounded-lg border p-4">
        <p className="text-sm font-medium">SEO</p>
        <TextField control={form.control} name="meta_title" label="Meta title" counter={70} />
        <TextareaField control={form.control} name="meta_description" label="Meta description" counter={170} rows={2} />
      </div>
    </FormDialog>
  );
}

export function BrandsPage() {
  const { can } = usePermissions();
  const state = useTableState({ defaultSort: "name", defaultOrder: "asc", filterKeys: ["is_active"] });
  const { data, isLoading, isFetching } = useListQuery<Brand>("/brands", state.params);
  const del = useDeleteMutation("/brands", { successMessage: "Brand deleted" });
  const confirm = useConfirmState<Brand>();
  const [editing, setEditing] = useState<Brand | null>(null);
  const [open, setOpen] = useState(false);
  const edit = (b: Brand | null) => {
    setEditing(b);
    setOpen(true);
  };

  const columns = useMemo<ColumnDef<Brand>[]>(
    () => [
      {
        accessorKey: "name",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Brand" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
              {row.original.logo_url ? (
                <img src={row.original.logo_url} alt="" className="size-full object-contain p-1" />
              ) : (
                <TbTag className="text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="font-medium">{row.original.name}</div>
              <div className="text-muted-foreground text-xs">/{row.original.slug}</div>
            </div>
          </div>
        ),
      },
      {
        id: "products",
        header: "Products",
        cell: ({ row }) => <span className="tabular-nums">{row.original.products_count ?? row.original.product_count ?? "—"}</span>,
      },
      { accessorKey: "is_active", header: "Status", cell: ({ row }) => <BoolBadge value={row.original.is_active} /> },
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
              { label: can("brands.update") ? "Edit" : "View", icon: TbEdit, onClick: () => edit(row.original) },
              { label: "Delete", icon: TbTrash, destructive: true, hidden: !can("brands.delete"), onClick: () => confirm.ask(row.original) },
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
        title="Brands"
        description="Manufacturers and labels in your catalog."
        breadcrumbs={[{ label: "Catalog" }, { label: "Brands" }]}
        actions={
          <Can perm="brands.create">
            <Button onClick={() => edit(null)}>
              <TbPlus /> Add brand
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId="brands"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search brands…"
        filters={[
          {
            key: "is_active",
            label: "Status",
            options: [
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ],
          },
        ]}
        onRowClick={edit}
        emptyTitle="No brands yet"
      />
      <BrandDialog open={open} onOpenChange={setOpen} brand={editing} />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete brand?"
        description={`"${confirm.target?.name ?? ""}" will be deleted.`}
        onConfirm={() => (confirm.target ? del.mutateAsync(confirm.target.id) : undefined)}
      />
    </>
  );
}
