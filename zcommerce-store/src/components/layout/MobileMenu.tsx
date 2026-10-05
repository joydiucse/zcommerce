"use client";

import { useState } from "react";
import { FiChevronRight, FiMenu } from "react-icons/fi";
import { Drawer } from "@/components/ui/Drawer";
import { SmartLink } from "@/components/ui/SmartLink";
import type { MenuLink } from "@/lib/types";
import { SearchBox } from "./SearchBox";

export function MobileMenu({ items, storeName }: { items: MenuLink[]; storeName: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const links: MenuLink[] = [
    ...items,
    ...[
      { label: "All products", url: "/products" },
      { label: "Categories", url: "/categories" },
      { label: "Brands", url: "/brands" },
    ].filter((d) => !items.some((i) => i.url === d.url)),
  ];
  return (
    <>
      <button
        type="button"
        className="-ml-2 rounded-full p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <FiMenu className="size-6" />
      </button>
      <Drawer open={open} onClose={close} title={storeName} side="left">
        <div className="p-4">
          <SearchBox />
        </div>
        <nav aria-label="Mobile">
          <ul className="divide-y divide-slate-100 border-y border-slate-100">
            {links.map((l) => (
              <li key={`${l.label}-${l.url}`}>
                <SmartLink
                  href={l.url}
                  onClick={close}
                  className="flex items-center justify-between px-5 py-3.5 text-base font-medium text-slate-800 hover:bg-slate-50"
                >
                  {l.label}
                  <FiChevronRight className="size-4 text-slate-400" aria-hidden />
                </SmartLink>
              </li>
            ))}
            <li>
              <SmartLink href="/account" onClick={close} className="flex items-center justify-between px-5 py-3.5 text-base font-medium text-slate-800 hover:bg-slate-50">
                My account
                <FiChevronRight className="size-4 text-slate-400" aria-hidden />
              </SmartLink>
            </li>
          </ul>
        </nav>
      </Drawer>
    </>
  );
}
