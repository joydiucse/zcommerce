"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiLock, FiShoppingBag } from "react-icons/fi";
import { CouponForm, Totals } from "@/components/cart/CartSummary";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { useMoney, useStore } from "@/components/providers/StoreProvider";
import { ClientApiError, api, errorMessage } from "@/lib/client-api";
import { imageProps } from "@/lib/images";
import type { Address, Cart, Customer, Order, ShippingMethod } from "@/lib/types";
import { AddressFields, EMPTY_ADDRESS, validateAddress } from "./AddressFields";

export function Checkout() {
  const { cart, loading } = useCart();
  const { customer, ready } = useAuth();
  const { checkout } = useStore();

  if (loading || !ready) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_26rem]" aria-busy="true">
        <div className="space-y-4">
          <div className="skeleton h-40" />
          <div className="skeleton h-72" />
        </div>
        <div className="skeleton h-80" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <FiShoppingBag className="size-10 text-slate-300" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
        <Link href="/products" className="btn btn-primary mt-6">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (!checkout.guest_checkout && !customer) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <FiLock className="mx-auto size-10 text-primary" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Please sign in to check out</h2>
        <p className="mt-2 text-slate-600">This store requires an account to place orders.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account/login?next=/checkout" className="btn btn-primary">
            Sign in
          </Link>
          <Link href="/account/register?next=/checkout" className="btn btn-outline">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return <CheckoutForm key={customer?.id ?? "guest"} cart={cart} customer={customer} />;
}

function CheckoutForm({ cart, customer }: { cart: Cart; customer: Customer | null }) {
  const router = useRouter();
  const money = useMoney();
  const { checkout } = useStore();
  const saved = customer?.addresses ?? [];

  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [shipping, setShipping] = useState<Address>(() => {
    const first: Partial<Address> = saved[0] ?? {};
    return {
      ...EMPTY_ADDRESS,
      ...first,
      name: first.name || customer?.name || "",
      phone: first.phone || customer?.phone || "",
    };
  });
  const [sameBilling, setSameBilling] = useState(true);
  const [billing, setBilling] = useState<Address>(EMPTY_ADDRESS);
  const [methods, setMethods] = useState<ShippingMethod[] | null>(null);
  const [methodsError, setMethodsError] = useState("");
  const [methodId, setMethodId] = useState<string>("");
  const paymentOptions = [
    checkout.cod_enabled && { value: "cod" as const, label: "Cash on delivery", hint: "Pay when your order arrives." },
    checkout.manual_payment_enabled && {
      value: "manual" as const,
      label: "Manual payment / bank transfer",
      hint: checkout.manual_payment_instructions || "Payment instructions will be sent after you place the order.",
    },
  ].filter(Boolean) as { value: "cod" | "manual"; label: string; hint: string }[];
  const [payment, setPayment] = useState<"cod" | "manual" | "">(paymentOptions[0]?.value ?? "");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load shipping methods for this cart (re-load when the cart total changes).
  useEffect(() => {
    let cancelled = false;
    api<ShippingMethod[]>("/store/checkout/shipping-methods", { query: { cart_token: cart.token }, cartToken: cart.token })
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setMethods(list);
        setMethodsError("");
        setMethodId((cur) => (list.some((m) => m.id === cur) ? cur : (list[0]?.id ?? "")));
      })
      .catch((e) => {
        if (cancelled) return;
        setMethods([]);
        setMethodsError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [cart.token, cart.subtotal, cart.discount_total]);

  const method = methods?.find((m) => m.id === methodId) ?? null;
  const belowMin = checkout.min_order_amount > 0 && cart.subtotal < checkout.min_order_amount;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    for (const [k, v] of Object.entries(validateAddress(shipping))) errs[`shipping.${k}`] = v as string;
    if (!sameBilling) for (const [k, v] of Object.entries(validateAddress(billing))) errs[`billing.${k}`] = v as string;
    if (!methodId) errs.shipping_method = "Choose a shipping method";
    if (!payment) errs.payment = "Choose a payment method";
    if (checkout.terms_page_slug && !terms) errs.terms = "Please accept the terms and conditions";
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError("Please fix the highlighted fields.");
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const { data } = await api<{ order: Order } | Order>("/store/checkout", {
        method: "POST",
        auth: !!customer,
        body: {
          cart_token: cart.token,
          email: email.trim(),
          phone: phone.trim() || shipping.phone || undefined,
          shipping_address: shipping,
          billing_address: sameBilling ? shipping : billing,
          shipping_method_id: methodId,
          payment_method: payment,
          notes: notes.trim() || undefined,
        },
      });
      const order = "order" in data ? data.order : data;
      router.push(`/checkout/success?order=${encodeURIComponent(order.order_number)}&email=${encodeURIComponent(order.email || email.trim())}`);
    } catch (err) {
      if (err instanceof ClientApiError && err.details?.length) {
        const map: Record<string, string> = {};
        for (const d of err.details) map[d.path] = d.message;
        setErrors(map);
      }
      setFormError(errorMessage(err));
      setSubmitting(false);
    }
  };

  const sub = (prefix: string) =>
    Object.fromEntries(
      Object.entries(errors)
        .filter(([k]) => k.startsWith(`${prefix}.`))
        .map(([k, v]) => [k.slice(prefix.length + 1), v]),
    );

  const box = "rounded-card border border-slate-200 bg-white p-5 sm:p-6";

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_26rem]">
      <div className="space-y-6">
        <section className={box} aria-labelledby="co-contact">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="co-contact" className="text-lg font-semibold text-slate-900">
              Contact
            </h2>
            {!customer && (
              <Link href="/account/login?next=/checkout" className="text-sm font-medium text-primary hover:underline">
                Have an account? Sign in
              </Link>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="co-email" className="label">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="co-email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "co-email-err" : undefined}
              />
              {errors.email && (
                <p id="co-email-err" className="mt-1 text-sm text-red-600">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="co-phone" className="label">
                Phone
              </label>
              <input id="co-phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>
          </div>
        </section>

        <section className={box} aria-labelledby="co-shipping">
          <h2 id="co-shipping" className="mb-4 text-lg font-semibold text-slate-900">
            Shipping address
          </h2>
          {saved.length > 0 && (
            <div className="mb-4">
              <label htmlFor="co-saved" className="label">
                Use a saved address
              </label>
              <select
                id="co-saved"
                className="input"
                defaultValue="0"
                onChange={(e) => {
                  const a = saved[Number(e.target.value)];
                  if (a) setShipping({ ...EMPTY_ADDRESS, ...a });
                }}
              >
                {saved.map((a, i) => (
                  <option key={i} value={i}>
                    {[a.name, a.line1, a.city].filter(Boolean).join(", ")}
                  </option>
                ))}
              </select>
            </div>
          )}
          <AddressFields prefix="shipping" value={shipping} onChange={setShipping} errors={sub("shipping")} />
          <label className="mt-5 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={sameBilling} onChange={(e) => setSameBilling(e.target.checked)} className="size-4 accent-[var(--color-primary)]" />
            Billing address is the same as shipping
          </label>
          {!sameBilling && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <h3 className="mb-4 font-semibold text-slate-900">Billing address</h3>
              <AddressFields prefix="billing" value={billing} onChange={setBilling} errors={sub("billing")} />
            </div>
          )}
        </section>

        <fieldset className={box} aria-describedby={errors.shipping_method ? "co-sm-err" : undefined}>
          <legend className="sr-only">Shipping method</legend>
          <h2 className="mb-4 text-lg font-semibold text-slate-900" aria-hidden>
            Shipping method
          </h2>
          {methods === null ? (
            <div className="space-y-2">
              <div className="skeleton h-14" />
              <div className="skeleton h-14" />
            </div>
          ) : methods.length === 0 ? (
            <p className="text-sm text-slate-500">{methodsError || "No shipping methods are available for this order."}</p>
          ) : (
            <div className="space-y-2">
              {methods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-field border p-4 transition-colors ${
                    methodId === m.id ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping_method"
                    value={m.id}
                    checked={methodId === m.id}
                    onChange={() => setMethodId(m.id)}
                    className="size-4 accent-[var(--color-primary)]"
                  />
                  <span className="flex-1">
                    <span className="block font-medium text-slate-900">{m.name}</span>
                    {(m.description || m.estimated_days) && (
                      <span className="block text-sm text-slate-500">{[m.description, m.estimated_days && `${m.estimated_days}`].filter(Boolean).join(" · ")}</span>
                    )}
                  </span>
                  <span className="font-semibold text-slate-900">{m.cost === 0 ? "Free" : money(m.cost, cart.currency)}</span>
                </label>
              ))}
            </div>
          )}
          {errors.shipping_method && (
            <p id="co-sm-err" className="mt-2 text-sm text-red-600">
              {errors.shipping_method}
            </p>
          )}
        </fieldset>

        <fieldset className={box}>
          <legend className="sr-only">Payment method</legend>
          <h2 className="mb-4 text-lg font-semibold text-slate-900" aria-hidden>
            Payment
          </h2>
          {paymentOptions.length === 0 ? (
            <p className="text-sm text-slate-500">No payment methods are currently enabled. Please contact the store.</p>
          ) : (
            <div className="space-y-2">
              {paymentOptions.map((p) => (
                <label
                  key={p.value}
                  className={`flex cursor-pointer gap-3 rounded-field border p-4 transition-colors ${
                    payment === p.value ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={p.value}
                    checked={payment === p.value}
                    onChange={() => setPayment(p.value)}
                    className="mt-1 size-4 accent-[var(--color-primary)]"
                  />
                  <span>
                    <span className="block font-medium text-slate-900">{p.label}</span>
                    {payment === p.value && <span className="mt-1 block text-sm whitespace-pre-line text-slate-600">{p.hint}</span>}
                  </span>
                </label>
              ))}
            </div>
          )}
          {errors.payment && <p className="mt-2 text-sm text-red-600">{errors.payment}</p>}
          <div className="mt-5">
            <label htmlFor="co-notes" className="label">
              Order notes (optional)
            </label>
            <textarea
              id="co-notes"
              className="input min-h-20"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              placeholder="Delivery instructions, gift message…"
            />
          </div>
        </fieldset>
      </div>

      <aside aria-labelledby="co-summary" className="h-fit space-y-5 rounded-card border border-slate-200 bg-slate-50 p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 id="co-summary" className="text-lg font-semibold text-slate-900">
          Order summary
        </h2>
        <ul className="divide-y divide-slate-200">
          {cart.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-field bg-white">
                <Image {...imageProps(i.image_url)} alt={i.name} fill sizes="56px" className="object-cover" />
                <span className="absolute -top-0 -right-0 grid min-w-5 place-items-center rounded-bl-md bg-slate-700 px-1 text-[11px] leading-5 font-bold text-white">
                  {i.quantity}
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{i.name}</span>
              <span className="text-sm font-medium text-slate-900">{money(i.line_total, cart.currency)}</span>
            </li>
          ))}
        </ul>
        <CouponForm />
        <Totals cart={cart} shipping={method ? method.cost : undefined} />
        {checkout.terms_page_slug && (
          <div>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--color-primary)]"
                aria-invalid={!!errors.terms}
              />
              <span>
                I have read and agree to the{" "}
                <Link href={`/pages/${checkout.terms_page_slug}`} target="_blank" className="font-medium text-primary underline">
                  terms and conditions
                </Link>
                .
              </span>
            </label>
            {errors.terms && <p className="mt-1 text-sm text-red-600">{errors.terms}</p>}
          </div>
        )}
        {belowMin && (
          <p className="rounded-field bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
            Minimum order amount is {money(checkout.min_order_amount, cart.currency)}.
          </p>
        )}
        {formError && (
          <p className="rounded-field bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {formError}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting || belowMin || paymentOptions.length === 0}>
          <FiLock className="size-4" aria-hidden />
          {submitting ? "Placing order…" : "Place order"}
        </button>
      </aside>
    </form>
  );
}
