import { useEffect, useMemo, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWatch } from "react-hook-form";
import { z } from "zod";
import { FormSection } from "@/components/forms/form-section";
import { ImageField, SelectField, TextareaField, TextField } from "@/components/forms/fields";
import { CURRENCIES, LOCALES, timezones } from "@/features/settings/defaults";
import { SettingsShell } from "@/features/settings/settings-shell";
import { useSettingsForm } from "@/features/settings/use-settings-form";
import { formatMoney } from "@/lib/format";
import type { TenantSettings } from "@/types";

const schema = z.object({
  store_name: z.string().trim().min(1, "Store name is required").max(120),
  tagline: z.string().max(200),
  logo_url: z.string().nullable(),
  favicon_url: z.string().nullable(),
  contact_email: z.union([z.literal(""), z.email("Enter a valid email")]),
  contact_phone: z.string().max(50),
  address: z.string().max(500),
  currency: z.string().length(3, "Use a 3-letter ISO code"),
  currency_symbol: z.string().min(1, "Required").max(8),
  locale: z.string().min(2),
  timezone: z.string().min(1),
});

export function GeneralTab({ settings }: { settings: TenantSettings | undefined }) {
  const { form, onSubmit, saving } = useSettingsForm("general", settings, zodResolver(schema), "General");
  const [currency, locale, symbol] = useWatch({ control: form.control, name: ["currency", "locale", "currency_symbol"] });
  const prevCurrency = useRef(currency);
  useEffect(() => {
    if (prevCurrency.current !== currency && form.formState.dirtyFields.currency) {
      const known = CURRENCIES.find((c) => c.code === currency);
      if (known) form.setValue("currency_symbol", known.symbol, { shouldDirty: true });
    }
    prevCurrency.current = currency;
  }, [currency, form]);
  const tzOptions = useMemo(() => timezones().map((t) => ({ value: t, label: t.replace(/_/g, " ") })), []);

  const currencyOptions = useMemo(() => {
    const list = CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.name} (${c.symbol})` }));
    if (currency && !CURRENCIES.some((c) => c.code === currency)) list.unshift({ value: currency, label: currency });
    return list;
  }, [currency]);
  const localeOptions = useMemo(() => {
    if (locale && !LOCALES.some((l) => l.value === locale)) return [{ value: locale, label: locale }, ...LOCALES];
    return LOCALES;
  }, [locale]);

  return (
    <SettingsShell form={form} onSubmit={onSubmit} saving={saving}>
      <FormSection title="Store details" description="Your store name and contact information appear across the storefront.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="store_name" label="Store name" />
          <TextField control={form.control} name="tagline" label="Tagline" placeholder="Quality goods, delivered." />
          <TextField control={form.control} name="contact_email" label="Contact email" type="email" />
          <TextField control={form.control} name="contact_phone" label="Contact phone" />
        </div>
        <TextareaField control={form.control} name="address" label="Business address" rows={2} />
      </FormSection>

      <FormSection title="Branding" description="Logo is shown in the store header; favicon in the browser tab.">
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageField control={form.control} name="logo_url" label="Logo" aspect="aspect-[3/1]" contain description="PNG or SVG with transparent background, ~600×200." />
          <ImageField control={form.control} name="favicon_url" label="Favicon" aspect="aspect-[3/1]" contain description="Square image, at least 64×64." />
        </div>
      </FormSection>

      <FormSection title="Currency & region" description="Controls how prices and dates are formatted in the store and admin.">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            control={form.control}
            name="currency"
            label="Currency"
            options={currencyOptions}
          />
          <TextField control={form.control} name="currency_symbol" label="Currency symbol" />
          <SelectField control={form.control} name="locale" label="Locale" options={localeOptions} />
          <SelectField control={form.control} name="timezone" label="Timezone" options={tzOptions} />
        </div>
        <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm">
          <span className="text-muted-foreground">Preview: </span>
          <span className="font-semibold tabular-nums">{formatMoney(1234.5, { currency, locale, symbol })}</span>
          <span className="text-muted-foreground"> · {new Date().toLocaleDateString(locale || "en-US", { dateStyle: "long" })}</span>
        </div>
      </FormSection>
    </SettingsShell>
  );
}
