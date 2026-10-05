"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { FiLoader, FiSearch, FiX } from "react-icons/fi";
import { api } from "@/lib/client-api";
import { imageProps } from "@/lib/images";
import type { Brand, Product, Ref } from "@/lib/types";
import { useMoney } from "@/components/providers/StoreProvider";

interface Suggestions {
  products: Product[];
  categories: Ref[];
  brands: Brand[];
}

interface Option {
  href: string;
  label: string;
  kind: "product" | "category" | "brand" | "all";
}

export function SearchBox({ className = "", autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const money = useMoney();
  const id = useId();
  const listId = `${id}-list`;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Suggestions | null>(null);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced live suggestions
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api<Suggestions>("/store/search", { query: { q: term, limit: 5 }, signal: ctrl.signal });
        setData({ products: data?.products ?? [], categories: data?.categories ?? [], brands: data?.brands ?? [] });
        setActive(-1);
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") setData({ products: [], categories: [], brands: [] });
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const term = q.trim();
  const showData = term.length >= 2 ? data : null;
  const options: Option[] = showData
    ? [
        ...showData.products.map((p) => ({ href: `/products/${p.slug}`, label: p.name, kind: "product" as const })),
        ...showData.categories.map((c) => ({ href: `/categories/${c.slug}`, label: c.name, kind: "category" as const })),
        ...showData.brands.map((b) => ({ href: `/brands/${b.slug}`, label: b.name, kind: "brand" as const })),
        { href: `/search?q=${encodeURIComponent(term)}`, label: `See all results for “${term}”`, kind: "all" as const },
      ]
    : [];

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && options[active]) return go(options[active].href);
    if (term) go(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!options.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const expanded = open && term.length >= 2;
  const productById = new Map(showData?.products.map((p) => [p.slug, p]));


  const renderGroup = (kind: Option["kind"], title: string) => {
    const group = options.filter((o) => o.kind === kind);
    if (!group.length) return null;
    return (
      <li role="presentation">
        {kind !== "all" && <div className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</div>}
        <ul role="presentation">
          {group.map((o) => {
            const idx = options.indexOf(o);
            const product = o.kind === "product" ? productById.get(o.href.replace("/products/", "")) : undefined;
            const img = product?.images?.[0];
            const isActive = idx === active;
            return (
              <li key={o.href} id={`${id}-opt-${idx}`} role="option" aria-selected={isActive}>
                <Link
                  href={o.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 text-sm ${isActive ? "bg-slate-100" : "hover:bg-slate-50"} ${
                    o.kind === "all" ? "border-t border-slate-100 font-medium text-primary" : "text-slate-700"
                  }`}
                >
                  {o.kind === "product" && (
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {img && <Image {...imageProps(img.url)} alt={img.alt || o.label} fill sizes="40px" className="object-cover" />}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {product && <span className="shrink-0 font-semibold text-slate-900">{money(product.price)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </li>
    );
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form role="search" onSubmit={submit} action="/search">
        <label htmlFor={`${id}-input`} className="sr-only">
          Search products
        </label>
        <div className="relative">
          <FiSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id={`${id}-input`}
            name="q"
            type="search"
            autoComplete="off"
            autoFocus={autoFocus}
            placeholder="Search products, brands…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
            className="h-10 w-full rounded-field border border-slate-200 bg-slate-50 pr-9 pl-9 text-sm placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {loading ? (
            <FiLoader className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden />
          ) : (
            q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setData(null);
                }}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <FiX className="size-4" />
              </button>
            )
          )}
        </div>
      </form>
      {expanded && showData && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-auto rounded-card border border-slate-200 bg-white py-1 shadow-xl"
        >
          {options.length === 1 && <li className="px-4 py-3 text-sm text-slate-500">No quick matches.</li>}
          {renderGroup("product", "Products")}
          {renderGroup("category", "Categories")}
          {renderGroup("brand", "Brands")}
          {renderGroup("all", "")}
        </ul>
      )}
    </div>
  );
}
