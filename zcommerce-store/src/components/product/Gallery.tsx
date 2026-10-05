"use client";

import Image from "next/image";
import { useState } from "react";
import { imageProps } from "@/lib/images";
import type { ProductImage } from "@/lib/types";

export function Gallery({ images, name, badge }: { images: ProductImage[]; name: string; badge?: React.ReactNode }) {
  const list = images.length ? images : [{ url: "", alt: name }];
  const [active, setActive] = useState(0);
  const current = list[Math.min(active, list.length - 1)];
  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {list.length > 1 && (
        <ul className="scrollbar-none flex gap-3 overflow-x-auto md:max-h-[36rem] md:flex-col md:overflow-y-auto" aria-label="Product images">
          {list.map((img, i) => (
            <li key={`${img.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`relative block size-16 overflow-hidden rounded-field border-2 bg-slate-100 sm:size-20 ${
                  i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                }`}
                aria-label={`Show image ${i + 1} of ${list.length}`}
                aria-current={i === active}
              >
                <Image {...imageProps(img.url)} alt={img.alt || `${name} thumbnail ${i + 1}`} fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative aspect-square flex-1 overflow-hidden rounded-card bg-slate-100">
        <Image
          key={current.url}
          {...imageProps(current.url)}
          alt={current.alt || name}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        {badge && <div className="absolute top-4 left-4">{badge}</div>}
      </div>
    </div>
  );
}
