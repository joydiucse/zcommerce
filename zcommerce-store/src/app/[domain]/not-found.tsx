import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="container-store flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-7xl font-black text-primary/20">404</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">We couldn’t find that page</h1>
      <p className="mt-3 max-w-md text-slate-600">The page may have moved or no longer exists. Try searching or head back to the shop.</p>
      <form action="/search" role="search" className="mt-8 flex w-full max-w-md gap-2">
        <label htmlFor="nf-q" className="sr-only">
          Search
        </label>
        <input id="nf-q" name="q" type="search" placeholder="Search products…" className="input h-11" />
        <button type="submit" className="btn btn-primary h-11">
          Search
        </button>
      </form>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn btn-outline">
          Home
        </Link>
        <Link href="/products" className="btn btn-primary">
          Shop all products
        </Link>
      </div>
    </section>
  );
}
