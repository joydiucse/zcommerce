import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { IconType } from "react-icons";
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { FormSection } from "@/components/forms/form-section";
import { TextField } from "@/components/forms/fields";
import { SettingsShell } from "@/features/settings/settings-shell";
import { useSettingsForm } from "@/features/settings/use-settings-form";
import type { SocialSettings, TenantSettings } from "@/types";

const url = z.union([z.literal(""), z.url("Enter a full URL including https://")]);
const schema = z.object({ facebook: url, instagram: url, twitter: url, youtube: url, tiktok: url, linkedin: url });

const NETWORKS: { key: keyof SocialSettings; label: string; icon: IconType; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", icon: FaFacebook, placeholder: "https://facebook.com/yourstore" },
  { key: "instagram", label: "Instagram", icon: FaInstagram, placeholder: "https://instagram.com/yourstore" },
  { key: "twitter", label: "X (Twitter)", icon: FaXTwitter, placeholder: "https://x.com/yourstore" },
  { key: "youtube", label: "YouTube", icon: FaYoutube, placeholder: "https://youtube.com/@yourstore" },
  { key: "tiktok", label: "TikTok", icon: FaTiktok, placeholder: "https://tiktok.com/@yourstore" },
  { key: "linkedin", label: "LinkedIn", icon: FaLinkedin, placeholder: "https://linkedin.com/company/yourstore" },
];

export function SocialTab({ settings }: { settings: TenantSettings | undefined }) {
  const { form, onSubmit, saving } = useSettingsForm("social", settings, zodResolver(schema), "Social");
  return (
    <SettingsShell form={form} onSubmit={onSubmit} saving={saving}>
      <FormSection title="Social profiles" description="Shown as icons in the store footer and used in organization schema.">
        <div className="grid gap-4 md:grid-cols-2">
          {NETWORKS.map((n) => (
            <div key={n.key} className="flex items-start gap-3">
              <div className="bg-muted text-muted-foreground mt-6 flex size-9 shrink-0 items-center justify-center rounded-md">
                <n.icon className="size-4" />
              </div>
              <TextField control={form.control} name={n.key} label={n.label} placeholder={n.placeholder} className="flex-1" />
            </div>
          ))}
        </div>
      </FormSection>
    </SettingsShell>
  );
}
