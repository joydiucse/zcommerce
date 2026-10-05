"use client";

import { useState } from "react";
import { FaStar } from "react-icons/fa6";
import { FiCheckCircle } from "react-icons/fi";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, errorMessage } from "@/lib/client-api";

export function ReviewForm({ slug }: { slug: string }) {
  const { customer } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  if (status === "done") {
    return (
      <div className="flex items-start gap-3 rounded-card border border-emerald-200 bg-emerald-50 p-5 text-emerald-800" role="status">
        <FiCheckCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Thank you for your review!</p>
          <p className="text-sm">It has been submitted and will appear once it has been approved by our team.</p>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError("Please choose a star rating.");
    if (!body.trim()) return setError("Please write a few words about the product.");
    setError("");
    setStatus("sending");
    try {
      await api(`/store/products/${encodeURIComponent(slug)}/reviews`, {
        method: "POST",
        auth: !!customer,
        body: {
          rating,
          title: title.trim(),
          body: body.trim(),
          ...(customer ? {} : { author_name: name.trim() || "Anonymous" }),
        },
      });
      setStatus("done");
    } catch (err) {
      setError(errorMessage(err));
      setStatus("idle");
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6" noValidate>
      <h3 className="text-lg font-semibold text-slate-900">Write a review</h3>
      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              className={`p-0.5 ${(hover || rating) >= i ? "text-accent" : "text-slate-300"}`}
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              aria-pressed={rating === i}
            >
              <FaStar className="size-7" aria-hidden />
            </button>
          ))}
        </div>
      </fieldset>
      {!customer && (
        <div>
          <label htmlFor="review-name" className="label">
            Your name
          </label>
          <input id="review-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
        </div>
      )}
      <div>
        <label htmlFor="review-title" className="label">
          Title
        </label>
        <input id="review-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>
      <div>
        <label htmlFor="review-body" className="label">
          Review
        </label>
        <textarea id="review-body" className="input min-h-28" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} required />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-slate-500">Reviews are moderated and appear after approval.</p>
      <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
        {status === "sending" ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
