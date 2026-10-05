import { TbWorld } from "react-icons/tb";
import { cn, truncate } from "@/lib/utils";

/** Google search result snippet preview. */
export function GoogleSnippetPreview({
  title,
  description,
  url,
  siteName,
  className,
}: {
  title: string;
  description: string;
  url: string;
  siteName?: string;
  className?: string;
}) {
  let host = url;
  let crumbs = "";
  try {
    const u = new URL(url);
    host = u.host;
    crumbs = u.pathname.split("/").filter(Boolean).join(" › ");
  } catch {
    /* keep raw */
  }
  return (
    <div className={cn("rounded-lg border bg-white p-4 font-[arial,sans-serif] dark:bg-[#202124]", className)}>
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-full bg-[#f1f3f4] dark:bg-[#303134]">
          <TbWorld className="size-4 text-[#5f6368] dark:text-[#bdc1c6]" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm text-[#202124] dark:text-[#dadce0]">{siteName || host}</div>
          <div className="truncate text-xs text-[#4d5156] dark:text-[#bdc1c6]">
            {host}
            {crumbs && ` › ${crumbs}`}
          </div>
        </div>
      </div>
      <div className="mt-1.5 truncate text-xl leading-snug text-[#1a0dab] hover:underline dark:text-[#8ab4f8]">
        {truncate(title || "Page title", 60)}
      </div>
      <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-[#4d5156] dark:text-[#bdc1c6]">
        {description ? truncate(description, 160) : "Add a meta description to control how this page appears in search results."}
      </p>
    </div>
  );
}

/** Open Graph / social card preview. */
export function SocialCardPreview({
  title,
  description,
  url,
  image,
  className,
}: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  className?: string;
}) {
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    /* keep */
  }
  return (
    <div className={cn("bg-card overflow-hidden rounded-lg border", className)}>
      <div className="bg-muted flex aspect-[1.91/1] items-center justify-center">
        {image ? (
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <span className="text-muted-foreground text-xs">No OG image (1200×630 recommended)</span>
        )}
      </div>
      <div className="bg-muted/40 space-y-0.5 border-t px-3 py-2.5">
        <div className="text-muted-foreground text-[11px] uppercase">{host}</div>
        <div className="truncate text-sm font-semibold">{title || "Page title"}</div>
        <div className="text-muted-foreground line-clamp-1 text-xs">{description}</div>
      </div>
    </div>
  );
}

export function CharCounter({ value, max, recommended }: { value: string; max: number; recommended?: number }) {
  const len = value?.length ?? 0;
  const over = len > max;
  const good = recommended ? len >= recommended && len <= max : !over;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        over ? "text-destructive" : good ? "text-success" : "text-muted-foreground",
      )}
    >
      {len}/{max}
    </span>
  );
}
