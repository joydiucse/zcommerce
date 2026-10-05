import { zodResolver } from "@hookform/resolvers/zod";
import { useWatch } from "react-hook-form";
import { z } from "zod";
import { FormSection } from "@/components/forms/form-section";
import { ImageField, SwitchField, TextareaField, TextField } from "@/components/forms/fields";
import { GoogleSnippetPreview, SocialCardPreview } from "@/components/common/seo-preview";
import { SettingsShell } from "@/features/settings/settings-shell";
import { useSettingsForm } from "@/features/settings/use-settings-form";
import { STORE_URL } from "@/lib/env";
import type { TenantSettings } from "@/types";

const optionalUrl = z.union([z.literal(""), z.url("Enter a full URL including https://")]);

const schema = z.object({
  meta_title: z.string().max(70, "Keep it under 70 characters"),
  title_template: z
    .string()
    .max(100)
    .refine((v) => v === "" || v.includes("%s"), "Must contain %s where the page title goes"),
  meta_description: z.string().max(170, "Keep it under 170 characters"),
  meta_keywords: z.string().max(500),
  og_image_url: z.string().nullable(),
  twitter_handle: z.string().max(30).regex(/^(@?[A-Za-z0-9_]*)$/, "Letters, numbers and underscores only"),
  canonical_url: optionalUrl,
  robots_index: z.boolean(),
  google_site_verification: z.string().max(200),
  bing_site_verification: z.string().max(200),
  google_analytics_id: z.string().max(30).regex(/^(|G-[A-Z0-9]+|UA-[0-9-]+)$/i, "Looks like G-XXXXXXX"),
  gtm_id: z.string().max(30).regex(/^(|GTM-[A-Z0-9]+)$/i, "Looks like GTM-XXXXXX"),
  facebook_pixel_id: z.string().max(30).regex(/^[0-9]*$/, "Numbers only"),
  organization_schema: z.boolean(),
});

export function SeoTab({ settings }: { settings: TenantSettings | undefined }) {
  const { form, onSubmit, saving } = useSettingsForm("seo", settings, zodResolver(schema), "SEO");
  const [title, template, desc, og, canonical, robots] = useWatch({
    control: form.control,
    name: ["meta_title", "title_template", "meta_description", "og_image_url", "canonical_url", "robots_index"],
  });
  const storeName = settings?.general?.store_name ?? "Store";
  const homeUrl = canonical || STORE_URL;

  return (
    <SettingsShell form={form} onSubmit={onSubmit} saving={saving}>
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <FormSection title="Homepage meta" description="Default title and description used by search engines.">
            <TextField control={form.control} name="meta_title" label="Meta title" counter={70} />
            <TextField
              control={form.control}
              name="title_template"
              label="Title template"
              description={`Applied to every page. %s is replaced by the page title, e.g. "Blue Shirt | ${storeName}".`}
            />
            <TextareaField control={form.control} name="meta_description" label="Meta description" counter={170} rows={3} description="Aim for 120–160 characters." />
            <TextField control={form.control} name="meta_keywords" label="Keywords" placeholder="shoes, sneakers, running" description="Comma separated." />
            <TextField control={form.control} name="canonical_url" label="Canonical URL" placeholder="https://www.yourstore.com" />
          </FormSection>

          <FormSection title="Social sharing" description="How links to your store look on Facebook, X and messaging apps.">
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <ImageField control={form.control} name="og_image_url" label="Open Graph image" aspect="aspect-[1.91/1]" description="1200×630 recommended." />
              <TextField control={form.control} name="twitter_handle" label="X / Twitter handle" placeholder="@yourstore" />
            </div>
          </FormSection>

          <FormSection title="Indexing & structured data">
            <SwitchField control={form.control} name="robots_index" label="Allow search engines to index the store" description="Turn off while the store is under construction." />
            <SwitchField control={form.control} name="organization_schema" label="Organization schema (JSON-LD)" description="Adds structured data with your store name, logo and social profiles." />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={form.control} name="google_site_verification" label="Google site verification" placeholder="Verification code" />
              <TextField control={form.control} name="bing_site_verification" label="Bing site verification" placeholder="Verification code" />
            </div>
          </FormSection>

          <FormSection title="Analytics & tracking">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField control={form.control} name="google_analytics_id" label="Google Analytics 4" placeholder="G-XXXXXXXXXX" />
              <TextField control={form.control} name="gtm_id" label="Google Tag Manager" placeholder="GTM-XXXXXX" />
              <TextField control={form.control} name="facebook_pixel_id" label="Facebook Pixel ID" placeholder="1234567890" />
            </div>
          </FormSection>
        </div>
        <div className="xl:col-span-2">
          <div className="sticky top-20 space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Google preview</p>
              <GoogleSnippetPreview title={title || storeName} description={desc} url={homeUrl} siteName={storeName} />
              {!robots && <p className="text-destructive text-xs">Indexing is disabled — the store will be hidden from search results.</p>}
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Social preview</p>
              <SocialCardPreview title={title || storeName} description={desc} url={homeUrl} image={og} />
            </div>
            <p className="text-muted-foreground text-xs">
              Product page title example: <span className="text-foreground font-medium">{(template || "%s").replace("%s", "Classic T-Shirt")}</span>
            </p>
          </div>
        </div>
      </div>
    </SettingsShell>
  );
}
