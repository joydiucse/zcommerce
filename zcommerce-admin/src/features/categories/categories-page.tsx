import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";
import { TbCategory, TbEdit, TbPlus, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/common/can";
import { ConfirmDialog, useConfirmState } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { BoolBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { RowActions } from "@/components/data-table/row-actions";
import { FormDialog } from "@/components/forms/form-dialog";
import { ImageField, NumberField, SelectField, SwitchField, TextareaField, TextField } from "@/components/forms/fields";
import { useCategoryOptions } from "@/features/catalog-options";
import { usePermissions } from "@/hooks/use-auth";
import { useCreateMutation, useDeleteMutation, useListQuery, useUpdateMutation } from "@/hooks/use-resource";
import { useTableState } from "@/hooks/use-table-state";
import { applyApiErrors } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { slugify } from "@/lib/utils";
import type { Category } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and dashes only"),
  parent_id: z.string().nullable(),
  description: z.string(),
  image_url: z.string().nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int(),
  meta_title: z.string().max(70),
  meta_description: z.string().max(170),
});
type Values = z.infer<typeof schema>;

const empty: Values = {
  name: "",
  slug: "",
  parent_id: null,
  description: "",
  image_url: null,
  is_active: true,
  sort_order: 0,
  meta_title: "",
  meta_description: "",
};

function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: Category | null;
}) {
  const { can } = usePermissions();
  const create = useCreateMutation<Values>("/categories", { successMessage: "Category created" });
  const update = useUpdateMutation<Values>("/categories", { successMessage: "Category saved" });
  const { options } = useCategoryOptions();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const slugTouched = useRef(false);

  useEffect(() => {
    if (!open) return;
    slugTouched.current = !!category;
    form.reset(
      category
        ? {
            name: category.name,
            slug: category.slug,
            parent_id: category.parent_id,
            description: category.description ?? "",
            image_url: category.image_url,
            is_active: category.is_active,
            sort_order: category.sort_order ?? 0,
            meta_title: category.meta_title ?? "",
            meta_description: category.meta_description ?? "",
          }
        : empty,
    );
  }, [open, category, form]);

  const onSubmit = async (v: Values) => {
    const body = { ...v, slug: v.slug || slugify(v.name) };
    try {
      if (category) await update.mutateAsync({ id: category.id, body });
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
      title={category ? "Edit category" : "New category"}
      form={form}
      onSubmit={onSubmit}
      readOnly={category ? !can("categories.update") : false}
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
        <SelectField
          control={form.control}
          name="parent_id"
          label="Parent category"
          noneLabel="None (top level)"
          options={options.filter((o) => o.value !== category?.id)}
        />
        <NumberField control={form.control} name="sort_order" label="Sort order" />
      </div>
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <ImageField control={form.control} name="image_url" label="Image" aspect="aspect-square" />
        <div className="space-y-4">
          <TextareaField control={form.control} name="description" label="Description" rows={4} />
          <SwitchField control={form.control} name="is_active" label="Active" description="Visible in the storefront." />
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

export function CategoriesPage() {
  const { can } = usePermissions();
  const state = useTableState({ defaultSort: "sort_order", defaultOrder: "asc", filterKeys: ["parent_id"] });
  const { data, isLoading, isFetching } = useListQuery<Category>("/categories", state.params);
  const { options, data: all } = useCategoryOptions();
  const del = useDeleteMutation("/categories", { successMessage: "Category deleted" });
  const confirm = useConfirmState<Category>();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);

  const nameById = useMemo(() => new Map((all ?? []).map((c) => [c.id, c.name])), [all]);

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: "name",
        enableSorting: true,
        enableHiding: false,
        header: ({ column }) => <ColumnHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="bg-muted flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border">
              {row.original.image_url ? (
                <img src={row.original.image_url} alt="" className="size-full object-cover" />
              ) : (
                <TbCategory className="text-muted-foreground" />
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
        id: "parent",
        header: "Parent",
        cell: ({ row }) => {
          const p = row.original.parent?.name ?? (row.original.parent_id ? nameById.get(row.original.parent_id) : null);
          return p ?? <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: "products",
        header: "Products",
        cell: ({ row }) => <span className="tabular-nums">{row.original.products_count ?? row.original.product_count ?? "—"}</span>,
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => <BoolBadge value={row.original.is_active} />,
      },
      {
        accessorKey: "sort_order",
        enableSorting: true,
        header: ({ column }) => <ColumnHeader column={column} title="Order" />,
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
              {
                label: can("categories.update") ? "Edit" : "View",
                icon: TbEdit,
                onClick: () => {
                  setEditing(row.original);
                  setOpen(true);
                },
              },
              {
                label: "Delete",
                icon: TbTrash,
                destructive: true,
                hidden: !can("categories.delete"),
                onClick: () => confirm.ask(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [can, confirm, nameById],
  );

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organize products into a browsable hierarchy."
        breadcrumbs={[{ label: "Catalog" }, { label: "Categories" }]}
        actions={
          <Can perm="categories.create">
            <Button onClick={openNew}>
              <TbPlus /> Add category
            </Button>
          </Can>
        }
      />
      <DataTable
        tableId="categories"
        columns={columns}
        data={data?.data}
        meta={data?.meta}
        isLoading={isLoading}
        isFetching={isFetching}
        state={state}
        searchPlaceholder="Search categories…"
        filters={[{ key: "parent_id", label: "Parent", options }]}
        onRowClick={(c) => {
          setEditing(c);
          setOpen(true);
        }}
        emptyTitle="No categories yet"
        emptyAction={
          can("categories.create") ? (
            <Button size="sm" onClick={openNew}>
              <TbPlus /> Add category
            </Button>
          ) : undefined
        }
      />
      <CategoryDialog open={open} onOpenChange={setOpen} category={editing} />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Delete category?"
        description={`"${confirm.target?.name ?? ""}" will be deleted. Products in it will become uncategorized.`}
        onConfirm={() => (confirm.target ? del.mutateAsync(confirm.target.id) : undefined)}
      />
    </>
  );
}
