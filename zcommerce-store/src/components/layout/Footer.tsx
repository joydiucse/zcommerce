import Link from "next/link";
import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { SmartLink } from "@/components/ui/SmartLink";
import type { PageSummary, SocialSettings, StoreSettings } from "@/lib/types";

const SOCIAL: { key: keyof SocialSettings; label: string; icon: IconType }[] = [
  { key: "facebook", label: "Facebook", icon: FaFacebookF },
  { key: "instagram", label: "Instagram", icon: FaInstagram },
  { key: "twitter", label: "X (Twitter)", icon: FaXTwitter },
  { key: "youtube", label: "YouTube", icon: FaYoutube },
  { key: "tiktok", label: "TikTok", icon: FaTiktok },
  { key: "linkedin", label: "LinkedIn", icon: FaLinkedinIn },
];

export function SocialLinks({ social, className = "" }: { social: SocialSettings; className?: string }) {
  const items = SOCIAL.filter((s) => social[s.key]);
  if (!items.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Social media">
      {items.map(({ key, label, icon: Icon }) => (
        <li key={key}>
          <a
            href={social[key]}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={label}
            className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-primary hover:text-primary-fg"
          >
            <Icon className="size-4" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Footer({ settings, pages }: { settings: StoreSettings; pages: PageSummary[] }) {
  const { general, navigation, social, theme } = settings;
  const footerPages = pages.filter((p) => p.show_in_footer);
  const columns = [...(navigation.footer_menus ?? [])];
  if (footerPages.length) {
    const used = new Set(columns.flatMap((c) => c.links.map((l) => l.url)));
    const extra = footerPages.filter((p) => !used.has(`/pages/${p.slug}`)).map((p) => ({ label: p.title, url: `/pages/${p.slug}` }));
    if (extra.length) columns.push({ title: "Information", links: extra });
  }
  const hasShop = columns.some((c) => c.title.trim().toLowerCase() === "shop" || c.links.some((l) => l.url === "/products"));
  if (!hasShop) {
    columns.unshift({
      title: "Shop",
      links: [
        { label: "All products", url: "/products" },
        { label: "Categories", url: "/categories" },
        { label: "Brands", url: "/brands" },
      ],
    });
  }
  return (
    <footer className="mt-16 bg-secondary text-slate-300">
      <div className="container-store grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Link href="/" className="text-xl font-bold text-white">
            {general.store_name}
          </Link>
          {general.tagline && <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">{general.tagline}</p>}
          <address className="mt-5 space-y-2 text-sm not-italic">
            {general.address && (
              <p className="flex gap-2">
                <FiMapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {general.address}
              </p>
            )}
            {general.contact_phone && (
              <p>
                <a href={`tel:${general.contact_phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 hover:text-white">
                  <FiPhone className="size-4" aria-hidden /> {general.contact_phone}
                </a>
              </p>
            )}
            {general.contact_email && (
              <p>
                <a href={`mailto:${general.contact_email}`} className="flex items-center gap-2 hover:text-white">
                  <FiMail className="size-4" aria-hidden /> {general.contact_email}
                </a>
              </p>
            )}
          </address>
          <SocialLinks social={social} className="mt-6" />
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
          {columns.map((col, i) => (
            <div key={`${col.title}-${i}`}>
              <h2 className="text-sm font-semibold tracking-wide text-white uppercase">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={`${l.label}-${l.url}`}>
                    <SmartLink href={l.url} className="text-sm text-slate-400 transition-colors hover:text-white">
                      {l.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="container-store flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row">
          <p>{theme.footer_text || `© ${new Date().getFullYear()} ${general.store_name}`}</p>
          <p>
            Prices in {general.currency}
          </p>
        </div>
      </div>
    </footer>
  );
}
