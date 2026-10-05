import { useEffect } from "react";
import { useForm, type DefaultValues, type FieldValues, type Resolver } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsKey } from "@/hooks/use-settings";
import { apiPut } from "@/lib/api";
import { applyApiErrors } from "@/lib/errors";
import { mergeDefaults, SETTINGS_DEFAULTS } from "@/features/settings/defaults";
import type { SettingsGroup, TenantSettings } from "@/types";

/**
 * Form bound to one settings group. Saving sends the FULL group object via
 * `PUT /tenant/settings/:group` and writes the response back into the cache.
 */
export function useSettingsForm<G extends SettingsGroup & keyof TenantSettings>(
  group: G,
  settings: TenantSettings | undefined,
  resolver: Resolver<TenantSettings[G] & FieldValues>,
  label: string,
) {
  type V = TenantSettings[G] & FieldValues;
  const qc = useQueryClient();
  const initial = mergeDefaults(SETTINGS_DEFAULTS[group], settings?.[group]) as V;
  const form = useForm<V>({ resolver, defaultValues: initial as DefaultValues<V> });

  // Only re-sync when THIS group's object changes, so saving another tab
  // doesn't wipe unsaved edits here.
  const groupValue = settings?.[group];
  useEffect(() => {
    if (groupValue !== undefined) form.reset(mergeDefaults(SETTINGS_DEFAULTS[group], groupValue) as V);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupValue, group]);

  const mutation = useMutation({
    mutationFn: (value: V) => apiPut<TenantSettings[G]>("tenant", `/settings/${group}`, value),
    onSuccess: (updated, sent) => {
      const value = (updated && typeof updated === "object" ? updated : sent) as TenantSettings[G];
      qc.setQueryData<TenantSettings>(settingsKey, (old) => (old ? { ...old, [group]: value } : old));
      toast.success(`${label} settings saved`);
    },
  });

  const onSubmit = async (v: V) => {
    try {
      await mutation.mutateAsync(v);
    } catch (e) {
      applyApiErrors(e, form.setError);
    }
  };

  return { form, onSubmit, saving: mutation.isPending };
}
