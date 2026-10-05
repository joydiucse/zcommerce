import { zodResolver } from "@hookform/resolvers/zod";
import { useWatch } from "react-hook-form";
import { z } from "zod";
import { FormSection } from "@/components/forms/form-section";
import { MoneyField, NumberField, SelectField, SwitchField, TextareaField } from "@/components/forms/fields";
import { SettingsShell } from "@/features/settings/settings-shell";
import { useSettingsForm } from "@/features/settings/use-settings-form";
import { useListQuery } from "@/hooks/use-resource";
import type { CmsPage, TenantSettings } from "@/types";

const schema = z
  .object({
    guest_checkout: z.boolean(),
    tax_rate: z.number().min(0, "Cannot be negative").max(100, "At most 100%"),
    tax_inclusive: z.boolean(),
    min_order_amount: z.number().min(0),
    cod_enabled: z.boolean(),
    manual_payment_enabled: z.boolean(),
    manual_payment_instructions: z.string().max(2000),
    terms_page_slug: z.string().max(160),
  })
  .refine((v) => v.cod_enabled || v.manual_payment_enabled, {
    path: ["manual_payment_enabled"],
    message: "Enable at least one payment method",
  });

export function CheckoutTab({ settings }: { settings: TenantSettings | undefined }) {
  const { form, onSubmit, saving } = useSettingsForm("checkout", settings, zodResolver(schema), "Checkout");
  const manual = useWatch({ control: form.control, name: "manual_payment_enabled" });
  const terms = useWatch({ control: form.control, name: "terms_page_slug" });
  const pages = useListQuery<CmsPage>("/pages", { limit: 100, sort: "title", order: "asc" });
  const pageOptions = (pages.data?.data ?? []).map((p) => ({ value: p.slug, label: `${p.title} (/pages/${p.slug})` }));
  if (terms && !pageOptions.some((o) => o.value === terms)) pageOptions.unshift({ value: terms, label: `/pages/${terms}` });

  return (
    <SettingsShell form={form} onSubmit={onSubmit} saving={saving}>
      <FormSection title="Checkout options">
        <SwitchField control={form.control} name="guest_checkout" label="Allow guest checkout" description="Customers can buy without creating an account." />
        <div className="grid gap-4 sm:grid-cols-2">
          <MoneyField control={form.control} name="min_order_amount" label="Minimum order amount" description="Set 0 for no minimum." />
          <SelectField control={form.control} name="terms_page_slug" label="Terms & conditions page" options={pageOptions} placeholder="Select a page" />
        </div>
      </FormSection>

      <FormSection title="Taxes">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField control={form.control} name="tax_rate" label="Tax rate" step="0.01" min={0} max={100} suffix="%" />
          <SwitchField control={form.control} name="tax_inclusive" label="Prices include tax" description="Tax is extracted from product prices instead of added." />
        </div>
      </FormSection>

      <FormSection title="Payment methods">
        <SwitchField control={form.control} name="cod_enabled" label="Cash on delivery" description="Customer pays the courier on delivery." />
        <SwitchField control={form.control} name="manual_payment_enabled" label="Manual payment" description="Bank transfer, mobile money or other offline methods." />
        {manual && (
          <TextareaField
            control={form.control}
            name="manual_payment_instructions"
            label="Manual payment instructions"
            rows={4}
            placeholder="e.g. Transfer the total to Account #123456 and include your order number."
            description="Shown on the order confirmation page and email."
          />
        )}
      </FormSection>
    </SettingsShell>
  );
}
