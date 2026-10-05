import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export function Section({
  title,
  subtitle,
  href,
  linkLabel = "View all",
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  id?: string;
}) {
  const headingId = id ?? `sec-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className="container-store">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 id={headingId} className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
            {linkLabel}
            <FiArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string | null; children?: React.ReactNode }) {
  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="container-store py-8 sm:py-10">
        {children}
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-slate-600">{description}</p>}
      </div>
    </div>
  );
}
