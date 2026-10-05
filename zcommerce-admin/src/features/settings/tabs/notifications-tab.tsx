import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormSection } from "@/components/forms/form-section";
import { SwitchField, TextField } from "@/components/forms/fields";
import { SettingsShell } from "@/features/settings/settings-shell";
import { useSettingsForm } from "@/features/settings/use-settings-form";
import type { TenantSettings } from "@/types";

const schema = z.object({
  admin_order_email: z.union([z.literal(""), z.email("Enter a valid email")]),
  low_stock_alerts: z.boolean(),
  customer_order_emails: z.boolean(),
});

export function NotificationsTab({ settings }: { settings: TenantSettings | undefined }) {
  const { form, onSubmit, saving } = useSettingsForm("notifications", settings, zodResolver(schema), "Notification");
  return (
    <SettingsShell form={form} onSubmit={onSubmit} saving={saving}>
      <FormSection title="Staff notifications">
        <TextField
          control={form.control}
          name="admin_order_email"
          label="New order email"
          type="email"
          placeholder="orders@yourstore.com"
          description="Receives an email for every new order. Leave blank to disable."
        />
        <SwitchField control={form.control} name="low_stock_alerts" label="Low stock alerts" description="Notify staff when a product drops below its threshold." />
      </FormSection>
      <FormSection title="Customer notifications">
        <SwitchField control={form.control} name="customer_order_emails" label="Order emails" description="Send order confirmation and status update emails to customers." />
      </FormSection>
    </SettingsShell>
  );
}
