"use client";

import type { Address } from "@/lib/types";

export const EMPTY_ADDRESS: Address = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
};

export function AddressFields({
  value,
  onChange,
  prefix,
  errors = {},
  showPhone = true,
}: {
  value: Address;
  onChange: (a: Address) => void;
  prefix: string;
  errors?: Partial<Record<keyof Address, string>>;
  showPhone?: boolean;
}) {
  const field = (key: keyof Address, label: string, opts: { required?: boolean; autoComplete?: string; className?: string; type?: string } = {}) => {
    const id = `${prefix}-${key}`;
    const err = errors[key];
    return (
      <div className={opts.className}>
        <label htmlFor={id} className="label">
          {label}
          {opts.required && <span className="text-red-500"> *</span>}
        </label>
        <input
          id={id}
          type={opts.type ?? "text"}
          className="input"
          value={value[key] ?? ""}
          onChange={(e) => onChange({ ...value, [key]: e.target.value })}
          required={opts.required}
          autoComplete={opts.autoComplete ? `${prefix === "billing" ? "billing" : "shipping"} ${opts.autoComplete}` : undefined}
          aria-invalid={!!err}
          aria-describedby={err ? `${id}-err` : undefined}
        />
        {err && (
          <p id={`${id}-err`} className="mt-1 text-sm text-red-600">
            {err}
          </p>
        )}
      </div>
    );
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {field("name", "Full name", { required: true, autoComplete: "name", className: showPhone ? "" : "sm:col-span-2" })}
      {showPhone && field("phone", "Phone", { autoComplete: "tel", type: "tel" })}
      {field("line1", "Address", { required: true, autoComplete: "address-line1", className: "sm:col-span-2" })}
      {field("line2", "Apartment, suite, etc. (optional)", { autoComplete: "address-line2", className: "sm:col-span-2" })}
      {field("city", "City", { required: true, autoComplete: "address-level2" })}
      {field("state", "State / Region", { autoComplete: "address-level1" })}
      {field("postal_code", "Postal code", { required: true, autoComplete: "postal-code" })}
      {field("country", "Country", { required: true, autoComplete: "country-name" })}
    </div>
  );
}

export function validateAddress(a: Address): Partial<Record<keyof Address, string>> {
  const e: Partial<Record<keyof Address, string>> = {};
  if (!a.name.trim()) e.name = "Required";
  if (!a.line1.trim()) e.line1 = "Required";
  if (!a.city.trim()) e.city = "Required";
  if (!a.postal_code.trim()) e.postal_code = "Required";
  if (!a.country.trim()) e.country = "Required";
  return e;
}

export function formatAddress(a: Partial<Address> | null | undefined): string[] {
  if (!a) return [];
  return [
    a.name,
    a.line1,
    a.line2,
    [a.city, a.state, a.postal_code].filter(Boolean).join(", "),
    a.country,
    a.phone,
  ].filter((x): x is string => !!x && !!x.trim());
}
