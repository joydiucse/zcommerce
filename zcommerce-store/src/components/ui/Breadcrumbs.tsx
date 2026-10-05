import Link from "next/link";
import { FiChevronRight, FiHome } from "react-icons/fi";

export interface Crumb {
  name: string;
  path: string;
}

/** Visible breadcrumb trail. The first crumb (Home) is implied; pass the rest. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-slate-500">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${c.path}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <FiChevronRight className="size-3.5 text-slate-300" aria-hidden />}
              {last ? (
                <span aria-current="page" className="line-clamp-1 font-medium text-slate-800">
                  {c.name}
                </span>
              ) : (
                <Link href={c.path} className="inline-flex items-center gap-1 hover:text-primary">
                  {i === 0 && <FiHome className="size-3.5" aria-hidden />}
                  {c.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function withHome(items: Crumb[]): Crumb[] {
  return [{ name: "Home", path: "/" }, ...items];
}
