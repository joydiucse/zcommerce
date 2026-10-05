import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function pagesToShow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - (pages[i - 1] as number) > 1) out.push("…");
    out.push(p);
  });
  return out;
}

/**
 * Crawlable pagination. Emits rel="prev"/"next" on the links and as <link> tags
 * (React hoists them into <head>).
 */
export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const prev = page > 1 ? hrefFor(page - 1) : null;
  const next = page < totalPages ? hrefFor(page + 1) : null;
  const base = "grid h-10 min-w-10 place-items-center rounded-field px-3 text-sm font-medium";
  return (
    <>
      {prev && <link rel="prev" href={prev} />}
      {next && <link rel="next" href={next} />}
      <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
        {prev ? (
          <Link href={prev} rel="prev" className={`${base} border border-slate-200 hover:border-primary hover:text-primary`} aria-label="Previous page">
            <FiChevronLeft className="size-4" />
          </Link>
        ) : (
          <span className={`${base} border border-slate-100 text-slate-300`} aria-hidden>
            <FiChevronLeft className="size-4" />
          </span>
        )}
        <ul className="flex items-center gap-1.5">
          {pagesToShow(page, totalPages).map((p, i) =>
            p === "…" ? (
              <li key={`e${i}`} className="px-1 text-slate-400" aria-hidden>
                …
              </li>
            ) : (
              <li key={p}>
                {p === page ? (
                  <span aria-current="page" className={`${base} bg-primary text-primary-fg`}>
                    {p}
                  </span>
                ) : (
                  <Link
                    href={hrefFor(p)}
                    rel={p === page - 1 ? "prev" : p === page + 1 ? "next" : undefined}
                    className={`${base} border border-slate-200 text-slate-700 hover:border-primary hover:text-primary`}
                    aria-label={`Page ${p}`}
                  >
                    {p}
                  </Link>
                )}
              </li>
            ),
          )}
        </ul>
        {next ? (
          <Link href={next} rel="next" className={`${base} border border-slate-200 hover:border-primary hover:text-primary`} aria-label="Next page">
            <FiChevronRight className="size-4" />
          </Link>
        ) : (
          <span className={`${base} border border-slate-100 text-slate-300`} aria-hidden>
            <FiChevronRight className="size-4" />
          </span>
        )}
      </nav>
    </>
  );
}
