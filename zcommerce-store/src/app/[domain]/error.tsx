"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FiAlertTriangle } from "react-icons/fi";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="container-store flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-amber-50 text-amber-500">
        <FiAlertTriangle className="size-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">Something went wrong</h1>
      <p className="mt-3 max-w-md text-slate-600">
        We couldn’t load this page right now. The store may be briefly unavailable — please try again in a moment.
      </p>
      {error.digest && <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Go home
        </Link>
      </div>
    </section>
  );
}
