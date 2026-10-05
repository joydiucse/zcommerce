"use client";

import { useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa6";
import { useStore } from "@/components/providers/StoreProvider";
import { api } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import type { Review } from "@/lib/types";

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex text-accent" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (i <= rating ? <FaStar key={i} className="size-4" aria-hidden /> : <FaRegStar key={i} className="size-4" aria-hidden />))}
    </span>
  );
}

export function ReviewList({ slug, initial, totalPages }: { slug: string; initial: Review[]; totalPages: number }) {
  const { locale } = useStore();
  const [reviews, setReviews] = useState(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!reviews.length) {
    return <p className="text-slate-500">No reviews yet. Be the first to share your thoughts!</p>;
  }

  const more = async () => {
    setLoading(true);
    try {
      const { data } = await api<Review[]>(`/store/products/${encodeURIComponent(slug)}/reviews`, { query: { page: page + 1, limit: 10 } });
      setReviews((r) => [...r, ...(data ?? [])]);
      setPage((p) => p + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ul className="divide-y divide-slate-100">
        {reviews.map((r) => (
          <li key={r.id} className="py-5 first:pt-0">
            <article>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <ReviewStars rating={r.rating} />
                {r.title && <h4 className="font-semibold text-slate-900">{r.title}</h4>}
              </div>
              {r.body && <p className="mt-2 leading-relaxed whitespace-pre-line text-slate-700">{r.body}</p>}
              <p className="mt-2 text-sm text-slate-500">
                {r.author_name || "Customer"}
                {r.created_at && (
                  <>
                    {" · "}
                    <time dateTime={r.created_at}>{formatDate(r.created_at, locale)}</time>
                  </>
                )}
              </p>
            </article>
          </li>
        ))}
      </ul>
      {page < totalPages && (
        <button type="button" onClick={more} disabled={loading} className="btn btn-outline mt-4">
          {loading ? "Loading…" : "Load more reviews"}
        </button>
      )}
    </div>
  );
}
