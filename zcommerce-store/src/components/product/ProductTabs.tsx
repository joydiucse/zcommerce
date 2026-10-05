"use client";

import { useId, useState } from "react";

export interface TabDef {
  id: string;
  label: string;
  content: React.ReactNode;
}

/** Accessible tabs (desktop). All panels are server-rendered in the HTML for SEO; inactive ones are hidden. */
export function ProductTabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    document.getElementById(`${base}-tab-${tabs[next].id}`)?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label="Product information" className="scrollbar-none flex gap-6 overflow-x-auto border-b border-slate-200">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            id={`${base}-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`-mb-px shrink-0 border-b-2 py-3 text-sm font-semibold transition-colors sm:text-base ${
              active === t.id ? "border-primary text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`${base}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={active !== t.id}
          className="py-8"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
