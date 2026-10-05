import Image from "next/image";
import Link from "next/link";
import { imageProps } from "@/lib/images";
import type { Brand } from "@/lib/types";

export function BrandStrip({ brands }: { brands: Brand[] }) {
  return (
    <ul className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
      {brands.map((b) => (
        <li key={b.id} className="w-36 shrink-0 snap-start sm:w-auto">
          <Link
            href={`/brands/${b.slug}`}
            className="flex h-24 items-center justify-center rounded-card border border-slate-200 bg-white p-4 grayscale transition hover:border-primary hover:grayscale-0"
            title={b.name}
          >
            {b.logo_url ? (
              <span className="relative block h-full w-full">
                <Image {...imageProps(b.logo_url)} alt={b.name} fill sizes="160px" className="object-contain" />
              </span>
            ) : (
              <span className="text-center text-lg font-bold text-slate-700">{b.name}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
