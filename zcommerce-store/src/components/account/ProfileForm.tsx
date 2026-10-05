"use client";

import { useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { AddressFields, EMPTY_ADDRESS, formatAddress, validateAddress } from "@/components/checkout/AddressFields";
import { useAuth } from "@/components/providers/AuthProvider";
import { errorMessage } from "@/lib/client-api";
import type { Address, Customer } from "@/lib/types";

export function ProfileForm() {
  const { customer } = useAuth();
  if (!customer) return null;
  return <ProfileEditor key={customer.id} customer={customer} />;
}

function ProfileEditor({ customer }: { customer: Customer }) {
  const { updateProfile } = useAuth();
  const [name, setName] = useState(customer.name ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [addresses, setAddresses] = useState<Address[]>(customer.addresses ?? []);
  const [editing, setEditing] = useState<number | null>(null); // index, or -1 for new
  const [draft, setDraft] = useState<Address>(EMPTY_ADDRESS);
  const [draftErrors, setDraftErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (nextAddresses = addresses) => {
    if (!name.trim()) {
      setStatus({ type: "error", text: "Name is required." });
      return false;
    }
    setSaving(true);
    setStatus(null);
    try {
      const updated = await updateProfile({ name: name.trim(), phone: phone.trim() || null, addresses: nextAddresses });
      setAddresses(updated.addresses ?? nextAddresses);
      setStatus({ type: "ok", text: "Your profile has been saved." });
      return true;
    } catch (e) {
      setStatus({ type: "error", text: errorMessage(e) });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async () => {
    const errs = validateAddress(draft);
    setDraftErrors(errs);
    if (Object.keys(errs).length) return;
    const next = editing === -1 ? [...addresses, draft] : addresses.map((a, i) => (i === editing ? draft : a));
    if (await save(next)) setEditing(null);
  };

  const removeAddress = async (idx: number) => {
    await save(addresses.filter((_, i) => i !== idx));
  };

  const box = "rounded-card border border-slate-200 p-5 sm:p-6";

  return (
    <div className="space-y-6">
      {status && (
        <p
          className={`rounded-field px-4 py-3 text-sm ${status.type === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
          role={status.type === "ok" ? "status" : "alert"}
        >
          {status.text}
        </p>
      )}
      <form
        className={box}
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-name" className="label">
              Full name
            </label>
            <input id="pf-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </div>
          <div>
            <label htmlFor="pf-phone" className="label">
              Phone
            </label>
            <input id="pf-phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-email" className="label">
              Email
            </label>
            <input id="pf-email" className="input bg-slate-50 text-slate-500" value={customer.email} readOnly aria-readonly />
          </div>
        </div>
        <button type="submit" className="btn btn-primary mt-5" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <section className={box} aria-labelledby="addr-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="addr-heading" className="text-lg font-semibold text-slate-900">
            Address book
          </h2>
          {editing === null && (
            <button
              type="button"
              className="btn btn-outline py-2"
              onClick={() => {
                setDraft({ ...EMPTY_ADDRESS, name, phone });
                setDraftErrors({});
                setEditing(-1);
              }}
            >
              <FiPlus className="size-4" aria-hidden /> Add address
            </button>
          )}
        </div>

        {editing !== null ? (
          <div>
            <h3 className="mb-4 font-medium text-slate-800">{editing === -1 ? "New address" : "Edit address"}</h3>
            <AddressFields prefix="addr" value={draft} onChange={setDraft} errors={draftErrors} />
            <div className="mt-5 flex gap-3">
              <button type="button" className="btn btn-primary" onClick={saveAddress} disabled={saving}>
                {saving ? "Saving…" : "Save address"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-slate-500">You haven’t saved any addresses yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {addresses.map((a, i) => (
              <li key={i} className="rounded-field border border-slate-200 p-4">
                {i === 0 && <span className="mb-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Default</span>}
                <address className="text-sm leading-relaxed text-slate-700 not-italic">
                  {formatAddress(a).map((l, j) => (
                    <div key={j}>{l}</div>
                  ))}
                </address>
                <div className="mt-3 flex gap-4 text-sm">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    onClick={() => {
                      setDraft({ ...EMPTY_ADDRESS, ...a });
                      setDraftErrors({});
                      setEditing(i);
                    }}
                  >
                    <FiEdit2 className="size-3.5" aria-hidden /> Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-red-600"
                    onClick={() => removeAddress(i)}
                    disabled={saving}
                  >
                    <FiTrash2 className="size-3.5" aria-hidden /> Remove
                  </button>
                  {i > 0 && (
                    <button
                      type="button"
                      className="font-medium text-slate-500 hover:text-slate-800"
                      onClick={() => save([a, ...addresses.filter((_, j) => j !== i)])}
                      disabled={saving}
                    >
                      Make default
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
