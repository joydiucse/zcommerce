import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useWatch } from "react-hook-form";
import { z } from "zod";
import { TbArrowDown, TbArrowUp, TbPhoto, TbPlus, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { FormSection } from "@/components/forms/form-section";
import { ImageField, NumberField, SwitchField, TextField } from "@/components/forms/fields";
import { MultiSelect } from "@/components/common/multi-select";
import { useCategoryOptions } from "@/features/catalog-options";
import { SettingsShell } from "@/features/settings/settings-shell";
import { useSettingsForm } from "@/features/settings/use-settings-form";
import type { TenantSettings } from "@/types";

const schema = z.object({
  announcement_bar: z.object({ enabled: z.boolean(), text: z.string().max(200), link: z.string().max(500) }),
  hero_slides: z.array(
    z.object({
      image_url: z.string().nullable(),
      title: z.string().max(120),
      subtitle: z.string().max(250),
      cta_text: z.string().max(40),
      cta_link: z.string().max(500),
    }),
  ),
  featured_category_ids: z.array(z.string()),
  sections: z.object({
    featured_products: z.boolean(),
    new_arrivals: z.boolean(),
    categories: z.boolean(),
    brands: z.boolean(),
    newsletter: z.boolean(),
  }),
  products_per_section: z.number().int().min(1, "At least 1").max(48, "At most 48"),
});

const SECTIONS: { key: "featured_products" | "new_arrivals" | "categories" | "brands" | "newsletter"; label: string; description: string }[] = [
  { key: "featured_products", label: "Featured products", description: "Products marked as featured." },
  { key: "new_arrivals", label: "New arrivals", description: "Most recently published products." },
  { key: "categories", label: "Featured categories", description: "Category tiles selected below." },
  { key: "brands", label: "Brands", description: "A strip of brand logos." },
  { key: "newsletter", label: "Newsletter signup", description: "Email capture block above the footer." },
];

export function HomepageTab({ settings }: { settings: TenantSettings | undefined }) {
  const { form, onSubmit, saving } = useSettingsForm("homepage", settings, zodResolver(schema), "Homepage");
  const slides = useFieldArray({ control: form.control, name: "hero_slides" });
  const categories = useCategoryOptions();
  const barEnabled = useWatch({ control: form.control, name: "announcement_bar.enabled" });
  const slideValues = useWatch({ control: form.control, name: "hero_slides" });

  return (
    <SettingsShell form={form} onSubmit={onSubmit} saving={saving}>
      <FormSection title="Announcement bar" description="A slim banner at the very top of every page.">
        <SwitchField control={form.control} name="announcement_bar.enabled" label="Show announcement bar" />
        {barEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="announcement_bar.text" label="Text" placeholder="Free shipping over $50" />
            <TextField control={form.control} name="announcement_bar.link" label="Link (optional)" placeholder="/products" />
          </div>
        )}
      </FormSection>

      <FormSection
        title="Hero slides"
        description="Large banners at the top of the homepage. Reorder with the arrows."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => slides.append({ image_url: null, title: "", subtitle: "", cta_text: "Shop now", cta_link: "/products" })}
          >
            <TbPlus /> Add slide
          </Button>
        }
      >
        {slides.fields.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-sm">
            <TbPhoto className="size-7" />
            No slides yet — add one to create a homepage hero.
          </div>
        )}
        <div className="space-y-4">
          {slides.fields.map((f, i) => (
            <div key={f.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Slide {i + 1}
                  {slideValues?.[i]?.title ? <span className="text-muted-foreground font-normal"> — {slideValues[i].title}</span> : null}
                </p>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => slides.move(i, i - 1)} aria-label="Move up">
                    <TbArrowUp />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={i === slides.fields.length - 1} onClick={() => slides.move(i, i + 1)} aria-label="Move down">
                    <TbArrowDown />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" onClick={() => slides.remove(i)} aria-label="Remove slide">
                    <TbTrash />
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr]">
                <ImageField control={form.control} name={`hero_slides.${i}.image_url`} aspect="aspect-[16/7]" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField control={form.control} name={`hero_slides.${i}.title`} label="Title" className="sm:col-span-2" />
                  <TextField control={form.control} name={`hero_slides.${i}.subtitle`} label="Subtitle" className="sm:col-span-2" />
                  <TextField control={form.control} name={`hero_slides.${i}.cta_text`} label="Button text" />
                  <TextField control={form.control} name={`hero_slides.${i}.cta_link`} label="Button link" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Sections" description="Choose which blocks appear on the homepage.">
        <div className="grid gap-3 md:grid-cols-2">
          {SECTIONS.map((s) => (
            <SwitchField key={s.key} control={form.control} name={`sections.${s.key}`} label={s.label} description={s.description} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="featured_category_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Featured categories</FormLabel>
                <MultiSelect
                  options={categories.options}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder={categories.isLoading ? "Loading categories…" : "Select categories"}
                />
                <FormDescription>Shown in the categories section, in this order.</FormDescription>
              </FormItem>
            )}
          />
          <NumberField control={form.control} name="products_per_section" label="Products per section" min={1} max={48} />
        </div>
      </FormSection>
    </SettingsShell>
  );
}
