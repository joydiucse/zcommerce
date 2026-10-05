import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, type Control } from "react-hook-form";
import { z } from "zod";
import { TbArrowDown, TbArrowUp, TbPlus, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/forms/form-section";
import { TextField } from "@/components/forms/fields";
import { SettingsShell } from "@/features/settings/settings-shell";
import { useSettingsForm } from "@/features/settings/use-settings-form";
import type { NavigationSettings, TenantSettings } from "@/types";

const link = z.object({ label: z.string().trim().min(1, "Label required").max(60), url: z.string().trim().min(1, "URL required").max(500) });
const schema = z.object({
  header_menu: z.array(link),
  footer_menus: z.array(z.object({ title: z.string().trim().min(1, "Title required").max(60), links: z.array(link) })),
});

type NavControl = Control<NavigationSettings>;

function MoveButtons({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (from: number, to: number) => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 gap-0.5 pt-0.5">
      <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label="Move up">
        <TbArrowUp />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" disabled={index === count - 1} onClick={() => onMove(index, index + 1)} aria-label="Move down">
        <TbArrowDown />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" onClick={onRemove} aria-label="Remove">
        <TbTrash />
      </Button>
    </div>
  );
}

function FooterGroupLinks({ control, groupIndex }: { control: NavControl; groupIndex: number }) {
  const links = useFieldArray({ control, name: `footer_menus.${groupIndex}.links` });
  return (
    <div className="space-y-2">
      {links.fields.map((f, i) => (
        <div key={f.id} className="flex items-start gap-2">
          <TextField control={control} name={`footer_menus.${groupIndex}.links.${i}.label`} placeholder="Label" className="flex-1" />
          <TextField control={control} name={`footer_menus.${groupIndex}.links.${i}.url`} placeholder="/pages/about" className="flex-1" />
          <MoveButtons index={i} count={links.fields.length} onMove={links.move} onRemove={() => links.remove(i)} />
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => links.append({ label: "", url: "" })}>
        <TbPlus /> Add link
      </Button>
    </div>
  );
}

export function NavigationTab({ settings }: { settings: TenantSettings | undefined }) {
  const { form, onSubmit, saving } = useSettingsForm("navigation", settings, zodResolver(schema), "Navigation");
  const control = form.control as unknown as NavControl;
  const header = useFieldArray({ control, name: "header_menu" });
  const footer = useFieldArray({ control, name: "footer_menus" });

  return (
    <SettingsShell form={form} onSubmit={onSubmit} saving={saving}>
      <FormSection
        title="Header menu"
        description="Main navigation links in the store header. Use relative paths like /products or full URLs."
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => header.append({ label: "", url: "" })}>
            <TbPlus /> Add link
          </Button>
        }
      >
        {header.fields.length === 0 && <p className="text-muted-foreground text-sm">No header links.</p>}
        <div className="space-y-2">
          {header.fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-2">
              <span className="text-muted-foreground mt-2 w-5 text-right text-xs tabular-nums">{i + 1}.</span>
              <TextField control={control} name={`header_menu.${i}.label`} placeholder="Label" className="flex-1" />
              <TextField control={control} name={`header_menu.${i}.url`} placeholder="/products" className="flex-1" />
              <MoveButtons index={i} count={header.fields.length} onMove={header.move} onRemove={() => header.remove(i)} />
            </div>
          ))}
        </div>
        <div className="text-muted-foreground text-xs">
          Useful paths: <code>/products</code>, <code>/categories/&lt;slug&gt;</code>, <code>/brands/&lt;slug&gt;</code>, <code>/pages/&lt;slug&gt;</code>
        </div>
      </FormSection>

      <FormSection
        title="Footer menus"
        description="Columns of links in the store footer."
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => footer.append({ title: "", links: [{ label: "", url: "" }] })}>
            <TbPlus /> Add group
          </Button>
        }
      >
        {footer.fields.length === 0 && <p className="text-muted-foreground text-sm">No footer menus.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          {footer.fields.map((f, gi) => (
            <div key={f.id} className="bg-muted/20 space-y-3 rounded-lg border p-4">
              <div className="flex items-start gap-2">
                <TextField control={control} name={`footer_menus.${gi}.title`} label="Group title" placeholder="Help" className="flex-1" />
                <div className="pt-6">
                  <MoveButtons index={gi} count={footer.fields.length} onMove={footer.move} onRemove={() => footer.remove(gi)} />
                </div>
              </div>
              <FooterGroupLinks control={control} groupIndex={gi} />
            </div>
          ))}
        </div>
      </FormSection>
    </SettingsShell>
  );
}
