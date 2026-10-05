import { cn } from "@/lib/utils";

function stringify(v: unknown): string {
  if (v === undefined) return "—";
  if (typeof v === "string") return v;
  return JSON.stringify(v, null, 2);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Renders audit `changes`. Supports `{ before, after }`, `{ old, new }`,
 * `{ field: { from, to } }` / `{ field: [old, new] }`, or any other JSON.
 */
export function JsonDiff({ changes }: { changes: unknown }) {
  if (!changes || (isRecord(changes) && Object.keys(changes).length === 0)) {
    return <p className="text-muted-foreground text-sm">No change data recorded.</p>;
  }

  let before: Record<string, unknown> | null = null;
  let after: Record<string, unknown> | null = null;

  if (isRecord(changes)) {
    const b = changes.before ?? changes.old;
    const a = changes.after ?? changes.new;
    if ((isRecord(b) || b === null || b === undefined) && (isRecord(a) || a === null || a === undefined) && ("before" in changes || "after" in changes || "old" in changes || "new" in changes)) {
      before = (b as Record<string, unknown> | null) ?? {};
      after = (a as Record<string, unknown> | null) ?? {};
    } else {
      const entries = Object.entries(changes);
      const fieldShape = entries.every(
        ([, v]) => (isRecord(v) && ("from" in v || "to" in v)) || (Array.isArray(v) && v.length === 2),
      );
      if (fieldShape) {
        before = {};
        after = {};
        for (const [k, v] of entries) {
          if (Array.isArray(v)) {
            before[k] = v[0];
            after[k] = v[1];
          } else if (isRecord(v)) {
            before[k] = v.from;
            after[k] = v.to;
          }
        }
      }
    }
  }

  if (!before || !after) {
    return (
      <pre className="bg-muted max-h-[420px] overflow-auto rounded-md p-3 text-xs leading-relaxed">
        {JSON.stringify(changes, null, 2)}
      </pre>
    );
  }

  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
  return (
    <div className="overflow-hidden rounded-md border text-xs">
      <div className="bg-muted/60 text-muted-foreground grid grid-cols-[140px_1fr_1fr] border-b font-medium">
        <div className="px-3 py-2">Field</div>
        <div className="border-l px-3 py-2">Before</div>
        <div className="border-l px-3 py-2">After</div>
      </div>
      <div className="max-h-[420px] overflow-auto">
        {keys.map((k) => {
          const b = stringify(before?.[k]);
          const a = stringify(after?.[k]);
          const changed = b !== a;
          return (
            <div key={k} className="grid grid-cols-[140px_1fr_1fr] border-b last:border-0">
              <div className="px-3 py-2 font-mono font-medium break-all">{k}</div>
              <pre
                className={cn(
                  "border-l px-3 py-2 font-mono break-all whitespace-pre-wrap",
                  changed && "bg-destructive/10 text-destructive",
                )}
              >
                {b}
              </pre>
              <pre
                className={cn(
                  "border-l px-3 py-2 font-mono break-all whitespace-pre-wrap",
                  changed && "bg-success/10 text-success",
                )}
              >
                {a}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
