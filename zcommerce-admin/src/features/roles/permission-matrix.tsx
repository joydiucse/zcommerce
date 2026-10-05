import { useMemo } from "react";
import { TbShieldCheck } from "react-icons/tb";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { humanize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PermissionGroup } from "@/types";

const ACTION_ORDER = ["view", "create", "update", "delete"];

/** Grid of permission checkboxes grouped by resource, plus a "full access" (*) switch. */
export function PermissionMatrix({
  groups,
  value,
  onChange,
  loading,
  disabled,
}: {
  groups: PermissionGroup[] | undefined;
  value: string[];
  onChange: (v: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const all = value.includes("*");
  const actions = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups ?? []) for (const k of g.keys) set.add(k.split(".").slice(1).join("."));
    return Array.from(set).sort((a, b) => {
      const ia = ACTION_ORDER.indexOf(a);
      const ib = ACTION_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    });
  }, [groups]);

  const allKeys = useMemo(() => (groups ?? []).flatMap((g) => g.keys), [groups]);
  const has = (k: string) => all || value.includes(k);

  const toggle = (k: string, on: boolean) => {
    const set = new Set(value.filter((x) => x !== "*"));
    if (on) set.add(k);
    else set.delete(k);
    onChange(Array.from(set));
  };

  const toggleGroup = (g: PermissionGroup, on: boolean) => {
    const set = new Set(value.filter((x) => x !== "*"));
    for (const k of g.keys) {
      if (on) set.add(k);
      else set.delete(k);
    }
    onChange(Array.from(set));
  };

  const toggleColumn = (action: string, on: boolean) => {
    const set = new Set(value.filter((x) => x !== "*"));
    for (const g of groups ?? []) {
      const k = `${g.group}.${action}`;
      if (!g.keys.includes(k)) continue;
      if (on) set.add(k);
      else set.delete(k);
    }
    onChange(Array.from(set));
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  const selectedCount = all ? allKeys.length : value.filter((v) => allKeys.includes(v)).length;

  return (
    <div className="space-y-3">
      <div className="bg-muted/40 flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
            <TbShieldCheck className="size-5" />
          </div>
          <div>
            <Label htmlFor="perm-all" className="cursor-pointer">
              Full access
            </Label>
            <p className="text-muted-foreground text-xs">Grants every permission (wildcard *), including future ones.</p>
          </div>
        </div>
        <Switch id="perm-all" checked={all} disabled={disabled} onCheckedChange={(on) => onChange(on ? ["*"] : [])} />
      </div>

      <div className={cn("overflow-x-auto rounded-lg border", all && "opacity-60")}>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="border-b">
              <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium uppercase">Resource</th>
              {actions.map((a) => {
                const colKeys = (groups ?? []).map((g) => `${g.group}.${a}`).filter((k) => allKeys.includes(k));
                const colAll = colKeys.length > 0 && colKeys.every(has);
                return (
                  <th key={a} className="text-muted-foreground px-2 py-2 text-center text-xs font-medium uppercase">
                    <button
                      type="button"
                      disabled={disabled || all}
                      onClick={() => toggleColumn(a, !colAll)}
                      className="hover:text-foreground disabled:hover:text-muted-foreground"
                      title={`Toggle all "${a}"`}
                    >
                      {humanize(a)}
                    </button>
                  </th>
                );
              })}
              <th className="text-muted-foreground px-3 py-2 text-center text-xs font-medium uppercase">All</th>
            </tr>
          </thead>
          <tbody>
            {(groups ?? []).map((g) => {
              const groupAll = g.keys.every(has);
              const groupSome = g.keys.some(has);
              return (
                <tr key={g.group} className="hover:bg-muted/30 border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{humanize(g.group)}</td>
                  {actions.map((a) => {
                    const k = `${g.group}.${a}`;
                    if (!g.keys.includes(k)) return <td key={a} className="px-2 py-2 text-center text-muted-foreground/40">—</td>;
                    return (
                      <td key={a} className="px-2 py-2 text-center">
                        <Checkbox
                          checked={has(k)}
                          disabled={disabled || all}
                          onCheckedChange={(on) => toggle(k, !!on)}
                          aria-label={k}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center">
                    <Checkbox
                      checked={groupAll ? true : groupSome ? "indeterminate" : false}
                      disabled={disabled || all}
                      onCheckedChange={() => toggleGroup(g, !groupAll)}
                      aria-label={`All ${g.group}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground text-xs">
        {selectedCount} of {allKeys.length} permissions selected
      </p>
    </div>
  );
}
