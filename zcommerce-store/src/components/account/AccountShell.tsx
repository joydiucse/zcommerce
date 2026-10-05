"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { FiLogOut, FiPackage, FiUser } from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";

const NAV = [
  { href: "/account", label: "Profile & addresses", icon: FiUser },
  { href: "/account/orders", label: "Orders", icon: FiPackage },
];

/** Guards account pages: redirects to login when there is no (refreshable) customer session. */
export function AccountShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { customer, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const leaving = useRef(false);

  useEffect(() => {
    if (ready && !customer && !leaving.current) router.replace(`/account/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, customer, router, pathname]);

  if (!ready || !customer) {
    return (
      <div className="container-store py-10" aria-busy="true">
        <div className="skeleton h-9 w-56" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_1fr]">
          <div className="skeleton h-32" />
          <div className="skeleton h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-store py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-1 text-slate-500">Signed in as {customer.email}</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Account">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/account" ? pathname === href : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-field px-3 py-2.5 text-sm font-medium whitespace-nowrap ${
                      active ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden /> {label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => {
                  leaving.current = true;
                  logout();
                  router.push("/");
                }}
                className="flex w-full items-center gap-2.5 rounded-field px-3 py-2.5 text-sm font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100"
              >
                <FiLogOut className="size-4" aria-hidden /> Sign out
              </button>
            </li>
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
