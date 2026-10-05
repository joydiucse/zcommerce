import { zodResolver } from "@hookform/resolvers/zod";
import { useWatch, type Control } from "react-hook-form";
import { z } from "zod";
import { TbShoppingBag, TbStarFilled } from "react-icons/tb";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/forms/form-section";
import { SelectField, TextField } from "@/components/forms/fields";
import { FONTS } from "@/features/settings/defaults";
import { SettingsShell } from "@/features/settings/settings-shell";
import { useSettingsForm } from "@/features/settings/use-settings-form";
import type { BorderRadius, TenantSettings, ThemeSettings } from "@/types";

const hex = z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, "Use a hex color like #4f46e5");

const schema = z.object({
  primary_color: hex,
  secondary_color: hex,
  accent_color: hex,
  font_family: z.string().min(1),
  border_radius: z.enum(["none", "sm", "md", "lg", "full"]),
  footer_text: z.string().max(300),
});

const RADIUS_PX: Record<BorderRadius, string> = { none: "0px", sm: "4px", md: "8px", lg: "14px", full: "9999px" };

function ColorField({ control, name, label, description }: { control: Control<ThemeSettings>; name: "primary_color" | "secondary_color" | "accent_color"; label: string; description?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-2">
            <label
              className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md border shadow-xs"
              style={{ background: field.value }}
              title="Pick a color"
            >
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(field.value) ? field.value : "#000000"}
                onChange={(e) => field.onChange(e.target.value)}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
              />
            </label>
            <FormControl>
              <Input value={field.value} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} className="font-mono uppercase" maxLength={7} />
            </FormControl>
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ThemePreview({ theme, storeName }: { theme: ThemeSettings; storeName: string }) {
  const radius = RADIUS_PX[theme.border_radius] ?? "8px";
  const btnRadius = theme.border_radius === "full" ? "9999px" : radius;
  const cardRadius = theme.border_radius === "full" ? "20px" : radius;
  const font = theme.font_family === "System UI" ? "system-ui, sans-serif" : `"${theme.font_family}", system-ui, sans-serif`;
  return (
    <div className="overflow-hidden rounded-xl border bg-white text-slate-900 shadow-sm" style={{ fontFamily: font }}>
      <div className="px-4 py-1.5 text-center text-[11px] font-medium text-white" style={{ background: theme.accent_color }}>
        Free shipping on orders over $50
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: theme.secondary_color }}>
        <span className="font-bold">{storeName}</span>
        <div className="flex items-center gap-4 text-xs opacity-80">
          <span>Shop</span>
          <span>New</span>
          <TbShoppingBag className="size-4" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        {[0, 1].map((i) => (
          <div key={i} className="overflow-hidden border border-slate-200" style={{ borderRadius: cardRadius }}>
            <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200" />
            <div className="space-y-1.5 p-2.5">
              <div className="text-xs font-semibold">Product {i + 1}</div>
              <div className="flex items-center gap-0.5" style={{ color: theme.accent_color }}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <TbStarFilled key={s} className="size-2.5" />
                ))}
              </div>
              <div className="text-sm font-bold" style={{ color: theme.primary_color }}>
                $49.00
              </div>
              <button type="button" className="w-full py-1.5 text-[11px] font-semibold text-white" style={{ background: theme.primary_color, borderRadius: btnRadius }}>
                Add to cart
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-4 pb-4">
        <span className="px-3 py-1.5 text-[11px] font-semibold text-white" style={{ background: theme.primary_color, borderRadius: btnRadius }}>
          Primary
        </span>
        <span className="border px-3 py-1.5 text-[11px] font-semibold" style={{ borderColor: theme.secondary_color, color: theme.secondary_color, borderRadius: btnRadius }}>
          Secondary
        </span>
        <span className="px-3 py-1.5 text-[11px] font-semibold text-white" style={{ background: theme.accent_color, borderRadius: btnRadius }}>
          Accent
        </span>
      </div>
      <div className="px-4 py-2.5 text-center text-[10px] text-white/80" style={{ background: theme.secondary_color }}>
        {theme.footer_text || " "}
      </div>
    </div>
  );
}

export function ThemeTab({ settings }: { settings: TenantSettings | undefined }) {
  const { form, onSubmit, saving } = useSettingsForm("theme", settings, zodResolver(schema), "Theme");
  const theme = useWatch({ control: form.control }) as ThemeSettings;

  return (
    <SettingsShell form={form} onSubmit={onSubmit} saving={saving}>
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <FormSection title="Colors" description="Brand colors used by buttons, links, header and highlights.">
            <div className="grid gap-4 sm:grid-cols-3">
              <ColorField control={form.control} name="primary_color" label="Primary" description="Buttons & prices" />
              <ColorField control={form.control} name="secondary_color" label="Secondary" description="Header & footer" />
              <ColorField control={form.control} name="accent_color" label="Accent" description="Badges & ratings" />
            </div>
            <div className="flex h-10 overflow-hidden rounded-md border">
              <div className="flex-1" style={{ background: theme.primary_color }} />
              <div className="flex-1" style={{ background: theme.secondary_color }} />
              <div className="flex-1" style={{ background: theme.accent_color }} />
            </div>
          </FormSection>
          <FormSection title="Typography & shape">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField control={form.control} name="font_family" label="Font family" options={FONTS.map((f) => ({ value: f, label: f }))} />
              <SelectField
                control={form.control}
                name="border_radius"
                label="Corner radius"
                options={[
                  { value: "none", label: "None (square)" },
                  { value: "sm", label: "Small" },
                  { value: "md", label: "Medium" },
                  { value: "lg", label: "Large" },
                  { value: "full", label: "Full (pill)" },
                ]}
              />
            </div>
            <TextField control={form.control} name="footer_text" label="Footer text" />
          </FormSection>
        </div>
        <div className="xl:col-span-2">
          <div className="sticky top-20 space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Live preview</p>
            <ThemePreview theme={theme} storeName={settings?.general?.store_name ?? "Your Store"} />
          </div>
        </div>
      </div>
    </SettingsShell>
  );
}
