import type { Metadata } from "next";
import { FiCheck, FiClock, FiMail, FiShoppingBag } from "react-icons/fi";
import { getPlatform } from "@/lib/api";
import type { PlatformPlan } from "@/lib/types";

/**
 * Shown (via src/proxy.ts) when the request host doesn't belong to any store, or the store is
 * suspended. Renders the platform's own details instead of a tenant storefront.
 */

type Props = {
  params: Promise<{ reason: string }>;
  searchParams: Promise<{ host?: string }>;
};

export const dynamic = "force-dynamic";

const COPY = {
  not_found: {
    title: "Store not found",
    body: "There is no store connected to this address. Check the URL, or open your own store on our platform.",
  },
  suspended: {
    title: "This store is temporarily unavailable",
    body: "The store at this address is currently offline. Please check back later.",
  },
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reason } = await params;
  const platform = await getPlatform();
  const copy = COPY[reason === "suspended" ? "suspended" : "not_found"];
  return {
    title: `${copy.title} · ${platform?.name ?? "zCommerce"}`,
    description: platform?.tagline,
    robots: { index: false, follow: false },
  };
}

function price(plan: PlatformPlan) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: plan.currency || "USD", maximumFractionDigits: 0 }).format(plan.price_monthly);
  } catch {
    return `$${plan.price_monthly}`;
  }
}

export default async function StoreUnavailablePage({ params, searchParams }: Props) {
  const [{ reason }, { host }, platform] = await Promise.all([params, searchParams, getPlatform()]);
  const kind = reason === "suspended" ? "suspended" : "not_found";
  const copy = COPY[kind];
  const name = platform?.name ?? "zCommerce";
  const Icon = kind === "suspended" ? FiClock : FiShoppingBag;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
              <FiShoppingBag aria-hidden />
            </span>
            {name}
          </span>
          {platform?.admin_url && (
            <a href={platform.admin_url} className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Merchant login
            </a>
          )}
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
            <Icon aria-hidden />
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h1>
          {host && (
            <p className="mt-3 inline-block rounded-md bg-slate-100 px-2.5 py-1 font-mono text-sm text-slate-600">{host}</p>
          )}
          <p className="mx-auto mt-4 max-w-xl text-slate-600">{copy.body}</p>
          {kind === "not_found" && platform?.admin_url && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={platform.admin_url} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                Go to merchant dashboard
              </a>
              {platform.support_email && (
                <a
                  href={`mailto:${platform.support_email}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FiMail aria-hidden /> Contact us
                </a>
              )}
            </div>
          )}
        </section>

        {kind === "not_found" && platform && platform.plans.length > 0 && (
          <section className="border-t border-slate-200 bg-white" aria-labelledby="plans-heading">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
              <div className="text-center">
                <h2 id="plans-heading" className="text-2xl font-bold tracking-tight">
                  {platform.tagline}
                </h2>
                <p className="mt-2 text-slate-600">Start selling with {name}. Pick a plan that fits your business.</p>
              </div>
              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {platform.plans.map((plan) => (
                  <article key={plan.slug} className="flex flex-col rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {plan.description && <p className="mt-1 text-sm text-slate-600">{plan.description}</p>}
                    <p className="mt-4">
                      <span className="text-3xl font-bold">{price(plan)}</span>
                      <span className="text-sm text-slate-500"> / month</span>
                    </p>
                    <ul className="mt-6 space-y-2 text-sm text-slate-700">
                      {(plan.features ?? []).map((f) => (
                        <li key={f} className="flex gap-2">
                          <FiCheck className="mt-0.5 shrink-0 text-indigo-600" aria-hidden />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {name}
      </footer>
    </div>
  );
}
