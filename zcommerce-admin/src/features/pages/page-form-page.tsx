import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useParams } from "react-router";
import { TbArrowLeft, TbExternalLink } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormSkeleton } from "@/components/common/loaders";
import { PageHeader } from "@/components/common/page-header";
import { GoogleSnippetPreview } from "@/components/common/seo-preview";
import { FormSection, SubmitButton } from "@/components/forms/form-section";
import { RichTextField, SwitchField, TextareaField, TextField } from "@/components/forms/fields";
import { usePermissions } from "@/hooks/use-auth";
import { useCreateMutation, useDetailQuery, useUpdateMutation } from "@/hooks/use-resource";
import { useTenantSettings } from "@/hooks/use-settings";
import { STORE_URL } from "@/lib/env";
import { applyApiErrors } from "@/lib/errors";
import { slugify, stripHtml } from "@/lib/utils";
import type { CmsPage } from "@/types";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and dashes only"),
  content: z.string(),
  is_published: z.boolean(),
  show_in_footer: z.boolean(),
  meta_title: z.string().max(70),
  meta_description: z.string().max(170),
});
type Values = z.infer<typeof schema>;

const empty: Values = {
  title: "",
  slug: "",
  content: "",
  is_published: false,
  show_in_footer: false,
  meta_title: "",
  meta_description: "",
};

export function PageFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { can } = usePermissions();
  const readOnly = !isNew && !can("pages.update");
  const settings = useTenantSettings();
  const detail = useDetailQuery<CmsPage>("/pages", id);
  const create = useCreateMutation<Values, CmsPage>("/pages", { successMessage: "Page created" });
  const update = useUpdateMutation<Values, CmsPage>("/pages", { successMessage: "Page saved" });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const slugTouched = useRef(!isNew);

  useEffect(() => {
    if (detail.data) {
      const p = detail.data;
      form.reset({
        title: p.title,
        slug: p.slug,
        content: p.content ?? "",
        is_published: p.is_published,
        show_in_footer: p.show_in_footer,
        meta_title: p.meta_title ?? "",
        meta_description: p.meta_description ?? "",
      });
    }
  }, [detail.data, form]);

  const [title, slug, content, metaTitle, metaDesc] = useWatch({
    control: form.control,
    name: ["title", "slug", "content", "meta_title", "meta_description"],
  });

  const onSubmit = async (v: Values) => {
    const body = { ...v, slug: v.slug || slugify(v.title) };
    try {
      if (isNew) {
        const created = await create.mutateAsync(body);
        navigate(created?.id ? `/pages/${created.id}` : "/pages", { replace: true });
      } else {
        await update.mutateAsync({ id, body });
      }
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  if (!isNew && detail.isLoading) {
    return (
      <>
        <PageHeader title="Loading page…" />
        <FormSkeleton />
      </>
    );
  }

  const template = settings.data?.seo?.title_template || "%s";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <PageHeader
          title={isNew ? "New page" : (detail.data?.title ?? "Edit page")}
          breadcrumbs={[{ label: "Store" }, { label: "Pages", to: "/pages" }, { label: isNew ? "New" : "Edit" }]}
          actions={
            <>
              <Button asChild variant="outline" type="button">
                <Link to="/pages">
                  <TbArrowLeft /> Back
                </Link>
              </Button>
              {!isNew && detail.data?.is_published && (
                <Button asChild variant="outline" type="button">
                  <a href={`${STORE_URL}/pages/${detail.data.slug}`} target="_blank" rel="noreferrer">
                    <TbExternalLink /> View
                  </a>
                </Button>
              )}
              {!readOnly && <SubmitButton loading={form.formState.isSubmitting}>{isNew ? "Create page" : "Save changes"}</SubmitButton>}
            </>
          }
        />
        <fieldset disabled={readOnly} className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <FormSection title="Content">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="title"
                  label="Title"
                  onValueChange={(v) => !slugTouched.current && form.setValue("slug", slugify(v))}
                />
                <TextField control={form.control} name="slug" label="Slug" onValueChange={() => (slugTouched.current = true)} />
              </div>
              <RichTextField control={form.control} name="content" label="Body" minHeight={360} />
            </FormSection>
            <FormSection title="Search engine listing">
              <GoogleSnippetPreview
                title={template.replace("%s", metaTitle || title || "Page title")}
                description={metaDesc || stripHtml(content).slice(0, 160)}
                url={`${STORE_URL}/pages/${slug || "page"}`}
                siteName={settings.data?.general?.store_name}
              />
              <TextField control={form.control} name="meta_title" label="Meta title" counter={70} />
              <TextareaField control={form.control} name="meta_description" label="Meta description" counter={170} rows={3} />
            </FormSection>
          </div>
          <div className="space-y-4">
            <FormSection title="Visibility">
              <SwitchField control={form.control} name="is_published" label="Published" description="Visible on the storefront." />
              <SwitchField control={form.control} name="show_in_footer" label="Show in footer" description="Link this page in the store footer." />
            </FormSection>
          </div>
        </fieldset>
      </form>
    </Form>
  );
}
