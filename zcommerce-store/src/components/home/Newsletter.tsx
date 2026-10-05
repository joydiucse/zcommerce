"use client";

import { useState } from "react";
import { FiCheckCircle, FiMail } from "react-icons/fi";

/**
 * Newsletter sign-up. CONTRACT.md has no newsletter endpoint yet, so the email is
 * validated client-side and the visitor is thanked; wire an endpoint here when available.
 */
export function Newsletter({ storeName }: { storeName: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  return (
    <section aria-labelledby="newsletter-heading" className="container-store">
      <div className="relative overflow-hidden rounded-card bg-primary px-6 py-12 text-primary-fg sm:px-12 lg:py-16">
        <div className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-24 -left-16 size-64 rounded-full bg-black/10" aria-hidden />
        <div className="relative mx-auto max-w-2xl text-center">
          <FiMail className="mx-auto size-8 opacity-80" aria-hidden />
          <h2 id="newsletter-heading" className="mt-3 text-2xl font-bold sm:text-3xl">
            Join the {storeName} newsletter
          </h2>
          <p className="mt-2 opacity-85">New arrivals, exclusive offers and the occasional good read. No spam.</p>
          {done ? (
            <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 font-medium" role="status">
              <FiCheckCircle className="size-5" aria-hidden /> Thanks for subscribing!
            </p>
          ) : (
            <form
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address.");
                setError("");
                setDone(true);
              }}
              noValidate
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "newsletter-error" : undefined}
                className="input h-12 flex-1 border-transparent"
              />
              <button type="submit" className="btn btn-lg h-12 bg-secondary text-white hover:opacity-90">
                Subscribe
              </button>
            </form>
          )}
          {error && (
            <p id="newsletter-error" className="mt-3 text-sm font-medium" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
