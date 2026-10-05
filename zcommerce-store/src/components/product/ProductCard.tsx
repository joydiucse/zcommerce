import Image from "next/image";
import Link from "next/link";
import { Stars } from "@/components/ui/Stars";
import { discountPercent } from "@/lib/format";
import { imageProps } from "@/lib/images";
import type { Product } from "@/lib/types";
import { Price } from "./Price";
import { QuickAdd } from "./QuickAdd";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const img = product.images?.[0];
  const second = product.images?.[1];
  const off = discountPercent(product.price, product.compare_at_price);
  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-slate-200 bg-white transition-shadow hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100" tabIndex={-1} aria-hidden>
        <Image
          {...imageProps(img?.url)}
          alt={img?.alt || product.name}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
          className={`object-cover transition duration-500 ${second ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
        />
        {second && (
          <Image
            {...imageProps(second.url)}
            alt=""
            fill
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
            className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
          />
        )}
        <span className="absolute top-3 left-3 flex flex-col gap-1.5">
          {off > 0 && <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">-{off}%</span>}
          {!product.in_stock && <span className="rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white">Sold out</span>}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.brand && <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{product.brand.name}</p>}
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base">
          <Link href={`/products/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        {product.rating_count > 0 && <Stars rating={product.rating_avg} count={product.rating_count} />}
        <div className="mt-auto pt-1">
          <Price price={product.price} compareAt={product.compare_at_price} />
        </div>
        <QuickAdd productId={product.id} name={product.name} inStock={product.in_stock} />
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0, cols = 4 }: { products: Product[]; priorityCount?: number; cols?: 3 | 4 }) {
  return (
    <ul className={`grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 ${cols === 4 ? "xl:grid-cols-4" : ""}`}>
      {products.map((p, i) => (
        <li key={p.id} className="flex">
          <div className="w-full">
            <ProductCard product={p} priority={i < priorityCount} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="overflow-hidden rounded-card border border-slate-200">
          <div className="skeleton aspect-square rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-4 w-1/4" />
            <div className="skeleton h-9 w-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
