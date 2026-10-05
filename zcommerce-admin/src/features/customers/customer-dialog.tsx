import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormDialog } from "@/components/forms/form-dialog";
import { SelectField, SwitchField, TextField } from "@/components/forms/fields";
import { useCreateMutation, useUpdateMutation } from "@/hooks/use-resource";
import { applyApiErrors } from "@/lib/errors";
import type { Customer } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Enter a valid email"),
  phone: z.string().trim(),
  status: z.enum(["active", "disabled"]),
  accepts_marketing: z.boolean(),
  password: z.string().refine((v) => v === "" || v.length >= 8, "At least 8 characters"),
});
type Values = z.infer<typeof schema>;

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customer: Customer | null;
}) {
  const create = useCreateMutation<Record<string, unknown>>("/customers", { successMessage: "Customer created" });
  const update = useUpdateMutation<Record<string, unknown>>("/customers", { successMessage: "Customer saved" });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", status: "active", accepts_marketing: false, password: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      status: customer?.status ?? "active",
      accepts_marketing: customer?.accepts_marketing ?? false,
      password: "",
    });
  }, [open, customer, form]);

  const onSubmit = async (v: Values) => {
    const { password, ...rest } = v;
    const body: Record<string, unknown> = { ...rest, phone: rest.phone || null };
    if (password) body.password = password;
    try {
      if (customer) await update.mutateAsync({ id: customer.id, body });
      else await create.mutateAsync(body);
      onOpenChange(false);
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={customer ? "Edit customer" : "New customer"} form={form} onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="name" label="Full name" />
        <TextField control={form.control} name="email" label="Email" type="email" />
        <TextField control={form.control} name="phone" label="Phone" />
        <SelectField
          control={form.control}
          name="status"
          label="Status"
          options={[
            { value: "active", label: "Active" },
            { value: "disabled", label: "Disabled" },
          ]}
        />
      </div>
      <TextField
        control={form.control}
        name="password"
        label={customer ? "New password" : "Password"}
        type="password"
        autoComplete="new-password"
        description={customer ? "Leave blank to keep the current password." : "Optional. Leave blank to create a guest account."}
      />
      <SwitchField control={form.control} name="accepts_marketing" label="Accepts marketing" description="Customer agreed to receive marketing emails." />
    </FormDialog>
  );
}
