import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { TbDeviceFloppy, TbLoader2 } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { usePermissions } from "@/hooks/use-auth";

export function SettingsShell<T extends FieldValues>({
  form,
  onSubmit,
  saving,
  children,
}: {
  form: UseFormReturn<T>;
  onSubmit: (v: T) => Promise<void>;
  saving: boolean;
  children: ReactNode;
}) {
  const { can } = usePermissions();
  const canEdit = can("settings.update");
  const dirty = form.formState.isDirty;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <fieldset disabled={!canEdit} className="space-y-4">
          {children}
        </fieldset>
        {canEdit && (
          <div className="bg-background/90 sticky bottom-0 z-10 -mx-1 flex items-center justify-end gap-3 rounded-lg border px-4 py-3 shadow-sm backdrop-blur">
            <span className="text-muted-foreground mr-auto text-xs">{dirty ? "You have unsaved changes" : "All changes saved"}</span>
            <Button type="button" variant="ghost" disabled={!dirty || saving} onClick={() => form.reset()}>
              Discard
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <TbLoader2 className="animate-spin" /> : <TbDeviceFloppy />}
              Save changes
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
