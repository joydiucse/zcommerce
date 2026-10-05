import Image from "next/image";
import Link from "next/link";
import { imageProps } from "@/lib/images";
import type { CategoryNode } from "@/lib/types";

export function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={`/categories/${c.slug}`} className="group block overflow-hidden rounded-card border border-slate-200 bg-white">
            <span className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/15 to-accent/15">
              {c.image_url ? (
                <Image
                  {...imageProps(c.image_url)}
                  alt={c.name}
                  fill
                  sizes="(min-width: 1024px) 200px, (min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-4xl font-black text-primary/40" aria-hidden>
                  {c.name.charAt(0)}
                </span>
              )}
            </span>
            <span className="block p-3">
              <span className="block truncate font-semibold text-slate-900 group-hover:text-primary">{c.name}</span>
              {typeof c.product_count === "number" && (
                <span className="text-xs text-slate-500">
                  {c.product_count} {c.product_count === 1 ? "product" : "products"}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
