import { useSearchParams } from "react-router";
import type { IconType } from "react-icons";
import {
  TbBell,
  TbBuildingStore,
  TbExternalLink,
  TbHome,
  TbMenu2,
  TbPalette,
  TbSeo,
  TbShare,
  TbShoppingCartCog,
} from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormSkeleton } from "@/components/common/loaders";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { CheckoutTab } from "@/features/settings/tabs/checkout-tab";
import { GeneralTab } from "@/features/settings/tabs/general-tab";
import { HomepageTab } from "@/features/settings/tabs/homepage-tab";
import { NavigationTab } from "@/features/settings/tabs/navigation-tab";
import { NotificationsTab } from "@/features/settings/tabs/notifications-tab";
import { SeoTab } from "@/features/settings/tabs/seo-tab";
import { SocialTab } from "@/features/settings/tabs/social-tab";
import { ThemeTab } from "@/features/settings/tabs/theme-tab";
import { usePermissions } from "@/hooks/use-auth";
import { useTenantSettings } from "@/hooks/use-settings";
import { STORE_URL } from "@/lib/env";
import type { SettingsGroup, TenantSettings } from "@/types";

const TABS: { value: SettingsGroup; label: string; icon: IconType; Comp: (p: { settings: TenantSettings | undefined }) => React.ReactNode }[] = [
  { value: "general", label: "General", icon: TbBuildingStore, Comp: GeneralTab },
  { value: "theme", label: "Theme", icon: TbPalette, Comp: ThemeTab },
  { value: "seo", label: "SEO", icon: TbSeo, Comp: SeoTab },
  { value: "social", label: "Social", icon: TbShare, Comp: SocialTab },
  { value: "homepage", label: "Homepage", icon: TbHome, Comp: HomepageTab },
  { value: "navigation", label: "Navigation", icon: TbMenu2, Comp: NavigationTab },
  { value: "checkout", label: "Checkout", icon: TbShoppingCartCog, Comp: CheckoutTab },
  { value: "notifications", label: "Notifications", icon: TbBell, Comp: NotificationsTab },
];

export function SettingsPage() {
  const [sp, setSp] = useSearchParams();
  const { can } = usePermissions();
  const settings = useTenantSettings();
  const current = (TABS.find((t) => t.value === sp.get("tab"))?.value ?? "general") as SettingsGroup;

  return (
    <>
      <PageHeader
        title="Settings"
        description={
          can("settings.update")
            ? "These settings power your storefront — changes go live as soon as you save."
            : "You have read-only access to settings."
        }
        breadcrumbs={[{ label: "Store" }, { label: "Settings" }]}
        actions={
          <Button asChild variant="outline">
            <a href={STORE_URL} target="_blank" rel="noreferrer">
              <TbExternalLink /> View store
            </a>
          </Button>
        }
      />
      <Tabs value={current} onValueChange={(v) => setSp({ tab: v }, { replace: true })} className="gap-5">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="h-10">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="px-3">
                <t.icon /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {settings.isLoading ? (
          <FormSkeleton rows={8} />
        ) : settings.isError ? (
          <EmptyState title="Couldn't load settings" description={settings.error.message} action={<Button onClick={() => settings.refetch()}>Retry</Button>} />
        ) : (
          TABS.map((t) => (
            <TabsContent key={t.value} value={t.value} forceMount className="data-[state=inactive]:hidden">
              <t.Comp settings={settings.data} />
            </TabsContent>
          ))
        )}
      </Tabs>
    </>
  );
}
