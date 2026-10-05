import Image from "next/image";
import Link from "next/link";
import { SmartLink } from "@/components/ui/SmartLink";
import { imageProps } from "@/lib/images";
import type { StoreSettings } from "@/lib/types";
import { AccountButton, CartButton } from "./HeaderActions";
import { MobileMenu } from "./MobileMenu";
import { SearchBox } from "./SearchBox";

export function AnnouncementBar({ settings }: { settings: StoreSettings }) {
  const bar = settings.homepage.announcement_bar;
  if (!bar?.enabled || !bar.text) return null;
  const content = <span className="font-medium">{bar.text}</span>;
  return (
    <div className="bg-secondary text-center text-sm text-white">
      <div className="container-store py-2">
        {bar.link ? (
          <SmartLink href={bar.link} className="underline-offset-4 hover:underline">
            {content}
          </SmartLink>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

export function Header({ settings }: { settings: StoreSettings }) {
  const { general, navigation } = settings;
  const menu = navigation.header_menu?.length ? navigation.header_menu : [{ label: "Shop", url: "/products" }];
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="container-store flex h-16 items-center gap-3 lg:gap-8">
        <MobileMenu items={menu} storeName={general.store_name} />
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${general.store_name} home`}>
          {general.logo_url ? (
            <Image
              {...imageProps(general.logo_url)}
              alt={general.store_name}
              width={160}
              height={40}
              priority
              className="h-8 w-auto max-w-40 object-contain"
            />
          ) : (
            <>
              <span className="grid size-8 place-items-center rounded-brand bg-primary text-sm font-black text-primary-fg" aria-hidden>
                {general.store_name.charAt(0).toUpperCase()}
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">{general.store_name}</span>
            </>
          )}
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {menu.map((item) => (
              <li key={`${item.label}-${item.url}`}>
                <SmartLink href={item.url} className="text-sm font-medium text-slate-600 transition-colors hover:text-primary">
                  {item.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto hidden w-full max-w-sm md:block">
          <SearchBox />
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <AccountButton />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
