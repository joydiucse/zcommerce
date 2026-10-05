import { useEffect, useRef } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useParams } from "react-router";
import { TbArrowLeft, TbExternalLink, TbPlus, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/page-header";
import { FormSkeleton } from "@/components/common/loaders";
import { MultiImageUpload } from "@/components/common/image-upload";
import { TagInput } from "@/components/common/multi-select";
import { GoogleSnippetPreview } from "@/components/common/seo-preview";
import { StatusBadge } from "@/components/common/status-badge";
import { FormSection, SubmitButton } from "@/components/forms/form-section";
import {
  MoneyField,
  NumberField,
  RichTextField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/forms/fields";
import { useBrandOptions, useCategoryOptions } from "@/features/catalog-options";
import { usePermissions } from "@/hooks/use-auth";
import { useCreateMutation, useDetailQuery, useUpdateMutation } from "@/hooks/use-resource";
import { useMoney, useTenantSettings } from "@/hooks/use-settings";
import { STORE_URL } from "@/lib/env";
import { applyApiErrors } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { slugify, stripHtml } from "@/lib/utils";
import type { Product } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  slug: z.string().trim().max(160).regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and dashes only"),
  sku: z.string().trim().max(100),
  short_description: z.string().max(500),
  description: z.string(),
  price: z.number().min(0, "Price must be 0 or more"),
  compare_at_price: z.number().min(0).nullable(),
  cost_price: z.number().min(0).nullable(),
  status: z.enum(["draft", "active", "archived"]),
  is_featured: z.boolean(),
  track_inventory: z.boolean(),
  stock_quantity: z.number().int("Must be a whole number"),
  low_stock_threshold: z.number().int().min(0),
  weight: z.number().min(0).nullable(),
  images: z.array(z.object({ url: z.string().min(1), alt: z.string() })),
  attributes: z.array(z.object({ name: z.string().trim().min(1, "Required"), value: z.string().trim().min(1, "Required") })),
  tags: z.array(z.string()),
  meta_title: z.string().max(70, "Keep it under 70 characters"),
  meta_description: z.string().max(170, "Keep it under 170 characters"),
  category_id: z.string().nullable(),
  brand_id: z.string().nullable(),
});
type Values = z.infer<typeof schema>;

const empty: Values = {
  name: "",
  slug: "",
  sku: "",
  short_description: "",
  description: "",
  price: 0,
  compare_at_price: null,
  cost_price: null,
  status: "draft",
  is_featured: false,
  track_inventory: true,
  stock_quantity: 0,
  low_stock_threshold: 5,
  weight: null,
  images: [],
  attributes: [],
  tags: [],
  meta_title: "",
  meta_description: "",
  category_id: null,
  brand_id: null,
};

function toValues(p: Product): Values {
  return {
    name: p.name ?? "",
    slug: p.slug ?? "",
    sku: p.sku ?? "",
    short_description: p.short_description ?? "",
    description: p.description ?? "",
    price: Number(p.price ?? 0),
    compare_at_price: p.compare_at_price === null || p.compare_at_price === undefined ? null : Number(p.compare_at_price),
    cost_price: p.cost_price === null || p.cost_price === undefined ? null : Number(p.cost_price),
    status: p.status ?? "draft",
    is_featured: !!p.is_featured,
    track_inventory: p.track_inventory ?? true,
    stock_quantity: Number(p.stock_quantity ?? 0),
    low_stock_threshold: Number(p.low_stock_threshold ?? 5),
    weight: p.weight === null || p.weight === undefined ? null : Number(p.weight),
    images: (p.images ?? []).map((i) => ({ url: i.url, alt: i.alt ?? "" })),
    attributes: (p.attributes ?? []).map((a) => ({ name: a.name, value: String(a.value ?? "") })),
    tags: p.tags ?? [],
    meta_title: p.meta_title ?? "",
    meta_description: p.meta_description ?? "",
    category_id: p.category_id ?? null,
    brand_id: p.brand_id ?? null,
  };
}

function toPayload(v: Values) {
  return {
    ...v,
    slug: v.slug || slugify(v.name),
    sku: v.sku || null,
    short_description: v.short_description || null,
    description: v.description || null,
    meta_title: v.meta_title || null,
    meta_description: v.meta_description || null,
  };
}

export function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { can } = usePermissions();
  const readOnly = !isNew && !can("products.update");
  const money = useMoney();
  const settings = useTenantSettings();
  const detail = useDetailQuery<Product>("/products", id);
  const create = useCreateMutation<ReturnType<typeof toPayload>, Product>("/products", {
    successMessage: "Product created",
    invalidate: ["/inventory"],
  });
  const update = useUpdateMutation<ReturnType<typeof toPayload>, Product>("/products", {
    successMessage: "Product saved",
    invalidate: ["/inventory"],
  });
  const categories = useCategoryOptions();
  const brands = useBrandOptions();
  const slugTouched = useRef(!isNew);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const attributes = useFieldArray({ control: form.control, name: "attributes" });

  useEffect(() => {
    if (detail.data) {
      form.reset(toValues(detail.data));
      slugTouched.current = true;
    }
  }, [detail.data, form]);

  const [name, slug, metaTitle, metaDesc, shortDesc, description, price, cost, compare, track] = useWatch({
    control: form.control,
    name: [
      "name",
      "slug",
      "meta_title",
      "meta_description",
      "short_description",
      "description",
      "price",
      "cost_price",
      "compare_at_price",
      "track_inventory",
    ],
  });

  const onSubmit = async (values: Values) => {
    const body = toPayload(values);
    try {
      if (isNew) {
        const created = await create.mutateAsync(body);
        navigate(created?.id ? `/products/${created.id}` : "/products", { replace: true });
      } else {
        await update.mutateAsync({ id, body });
      }
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  const margin = cost !== null && price > 0 ? ((price - cost) / price) * 100 : null;
  const storeName = settings.data?.general?.store_name ?? "Store";
  const template = settings.data?.seo?.title_template || "%s";
  const previewTitle = template.replace("%s", metaTitle || name || "Product name");
  const previewDesc = metaDesc || shortDesc || stripHtml(description).slice(0, 160);

  if (!isNew && detail.isLoading) {
    return (
      <>
        <PageHeader title="Loading product…" breadcrumbs={[{ label: "Products", to: "/products" }, { label: "Edit" }]} />
        <FormSkeleton rows={8} />
      </>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <PageHeader
          title={isNew ? "Add product" : (detail.data?.name ?? "Edit product")}
          description={
            !isNew && detail.data ? (
              <span className="inline-flex items-center gap-2">
                <StatusBadge status={detail.data.status} /> Last updated {formatDateTime(detail.data.updated_at)}
              </span>
            ) : (
              "Fill in the details and publish when you're ready."
            )
          }
          breadcrumbs={[{ label: "Catalog" }, { label: "Products", to: "/products" }, { label: isNew ? "New" : "Edit" }]}
          actions={
            <>
              <Button asChild variant="outline" type="button">
                <Link to="/products">
                  <TbArrowLeft /> Back
                </Link>
              </Button>
              {!isNew && detail.data?.slug && (
                <Button asChild variant="outline" type="button">
                  <a href={`${STORE_URL}/products/${detail.data.slug}`} target="_blank" rel="noreferrer">
                    <TbExternalLink /> Preview
                  </a>
                </Button>
              )}
              {!readOnly && (
                <SubmitButton loading={form.formState.isSubmitting}>{isNew ? "Create product" : "Save changes"}</SubmitButton>
              )}
            </>
          }
        />

        <fieldset disabled={readOnly} className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <FormSection title="General" description="Basic information shown to shoppers.">
              <TextField
                control={form.control}
                name="name"
                label="Name"
                placeholder="e.g. Classic cotton t-shirt"
                onValueChange={(v) => {
                  if (!slugTouched.current) form.setValue("slug", slugify(v));
                }}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL handle</FormLabel>
                    <div className="flex">
                      <span className="bg-muted text-muted-foreground inline-flex items-center rounded-l-md border border-r-0 px-3 text-xs">
                        /products/
                      </span>
                      <FormControl>
                        <Input
                          className="rounded-l-none"
                          placeholder="classic-cotton-t-shirt"
                          {...field}
                          onChange={(e) => {
                            slugTouched.current = true;
                            field.onChange(slugify(e.target.value) + (e.target.value.endsWith("-") ? "-" : ""));
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <TextareaField control={form.control} name="short_description" label="Short description" rows={2} counter={500} placeholder="A one or two sentence summary." />
              <RichTextField control={form.control} name="description" label="Description" />
            </FormSection>

            <FormSection title="Images" description="The first image is used as the primary product image.">
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => <MultiImageUpload value={field.value} onChange={field.onChange} />}
              />
            </FormSection>

            <FormSection title="Pricing">
              <div className="grid gap-4 sm:grid-cols-3">
                <MoneyField control={form.control} name="price" label="Price" />
                <MoneyField control={form.control} name="compare_at_price" label="Compare-at price" nullable description="Shown struck-through." />
                <MoneyField control={form.control} name="cost_price" label="Cost per item" nullable description="Not shown to customers." />
              </div>
              {(margin !== null || (compare !== null && compare > price)) && (
                <div className="bg-muted/50 flex flex-wrap gap-6 rounded-lg px-4 py-3 text-sm">
                  {margin !== null && cost !== null && (
                    <>
                      <div>
                        <div className="text-muted-foreground text-xs">Margin</div>
                        <div className="font-medium">{margin.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Profit</div>
                        <div className="font-medium">{money.format(price - cost)}</div>
                      </div>
                    </>
                  )}
                  {compare !== null && compare > price && (
                    <div>
                      <div className="text-muted-foreground text-xs">Discount</div>
                      <div className="font-medium">{Math.round(((compare - price) / compare) * 100)}% off</div>
                    </div>
                  )}
                </div>
              )}
            </FormSection>

            <FormSection title="Inventory">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={form.control} name="sku" label="SKU" placeholder="TSHIRT-001" />
                <NumberField control={form.control} name="weight" label="Weight" nullable step="0.01" suffix="kg" />
              </div>
              <SwitchField control={form.control} name="track_inventory" label="Track quantity" description="Decrease stock when orders are placed." />
              {track && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    control={form.control}
                    name="stock_quantity"
                    label="Quantity in stock"
                    description={!isNew ? "Use Inventory → Adjust to log changes with a reason." : undefined}
                  />
                  <NumberField control={form.control} name="low_stock_threshold" label="Low stock threshold" min={0} />
                </div>
              )}
            </FormSection>

            <FormSection
              title="Attributes"
              description="Specifications such as material, size or color."
              action={
                <Button type="button" size="sm" variant="outline" onClick={() => attributes.append({ name: "", value: "" })}>
                  <TbPlus /> Add
                </Button>
              }
            >
              {attributes.fields.length === 0 && <p className="text-muted-foreground text-sm">No attributes yet.</p>}
              {attributes.fields.map((f, i) => (
                <div key={f.id} className="flex items-start gap-2">
                  <TextField control={form.control} name={`attributes.${i}.name`} placeholder="Name (e.g. Material)" className="flex-1" />
                  <TextField control={form.control} name={`attributes.${i}.value`} placeholder="Value (e.g. Cotton)" className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => attributes.remove(i)} aria-label="Remove attribute">
                    <TbTrash />
                  </Button>
                </div>
              ))}
            </FormSection>

            <FormSection title="Search engine listing" description="Customize how this product appears in Google.">
              <GoogleSnippetPreview
                title={previewTitle}
                description={previewDesc}
                url={`${STORE_URL}/products/${slug || slugify(name) || "product"}`}
                siteName={storeName}
              />
              <TextField control={form.control} name="meta_title" label="Meta title" counter={70} placeholder={name || "Defaults to product name"} />
              <TextareaField control={form.control} name="meta_description" label="Meta description" counter={170} rows={3} placeholder="Defaults to the short description" />
            </FormSection>
          </div>

          <div className="space-y-4">
            <FormSection title="Status">
              <SelectField
                control={form.control}
                name="status"
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "active", label: "Active" },
                  { value: "archived", label: "Archived" },
                ]}
                description="Only active products are visible in the store."
              />
              <SwitchField control={form.control} name="is_featured" label="Featured" description="Show on the homepage." />
            </FormSection>
            <FormSection title="Organization">
              <SelectField control={form.control} name="category_id" label="Category" options={categories.options} noneLabel="No category" />
              <SelectField control={form.control} name="brand_id" label="Brand" options={brands.options} noneLabel="No brand" />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <TagInput value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
            {!isNew && detail.data && (
              <FormSection title="Insights">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">Rating</dt>
                    <dd className="font-medium">
                      {Number(detail.data.rating_avg ?? 0).toFixed(1)} ★ ({detail.data.rating_count})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Published</dt>
                    <dd className="font-medium">{formatDateTime(detail.data.published_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Created</dt>
                    <dd className="font-medium">{formatDateTime(detail.data.created_at)}</dd>
                  </div>
                </dl>
              </FormSection>
            )}
          </div>
        </fieldset>
      </form>
    </Form>
  );
}
