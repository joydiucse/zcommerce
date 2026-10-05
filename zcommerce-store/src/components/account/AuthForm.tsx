"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ClientApiError, errorMessage } from "@/lib/client-api";

function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  const { login, register, customer, ready } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const target = safeNext(next);

  useEffect(() => {
    if (ready && customer) router.replace(target);
  }, [ready, customer, router, target]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (mode === "register" && !form.name.trim()) errs.name = "Please enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (form.password.length < (mode === "register" ? 8 : 1)) errs.password = mode === "register" ? "Use at least 8 characters" : "Enter your password";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "login") await login(form.email.trim(), form.password);
      else
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        });
      router.replace(target);
    } catch (err) {
      if (err instanceof ClientApiError && err.details?.length) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      }
      setError(err instanceof ClientApiError && err.status === 401 ? "Incorrect email or password." : errorMessage(err));
      setBusy(false);
    }
  };

  const input = (k: keyof typeof form, label: string, type: string, autoComplete: string, required = true) => (
    <div>
      <label htmlFor={`auth-${k}`} className="label">
        {label}
      </label>
      <input
        id={`auth-${k}`}
        type={type}
        className="input"
        value={form[k]}
        onChange={set(k)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `auth-${k}-err` : undefined}
      />
      {errors[k] && (
        <p id={`auth-${k}-err`} className="mt-1 text-sm text-red-600">
          {errors[k]}
        </p>
      )}
    </div>
  );

  const nextQs = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{mode === "login" ? "Sign in" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login" ? "Welcome back! Sign in to track orders and check out faster." : "Save addresses and track your orders."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {mode === "register" && input("name", "Full name", "text", "name")}
          {input("email", "Email", "email", "email")}
          {mode === "register" && input("phone", "Phone (optional)", "tel", "tel", false)}
          {input("password", "Password", "password", mode === "login" ? "current-password" : "new-password")}
          {error && (
            <p className="rounded-field bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href={`/account/register${nextQs}`} className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={`/account/login${nextQs}`} className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
