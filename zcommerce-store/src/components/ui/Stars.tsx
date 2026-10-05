import { FaRegStar, FaStar, FaStarHalfStroke } from "react-icons/fa6";

export function Stars({ rating, count, size = "sm" }: { rating: number; count?: number; size?: "sm" | "md" }) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const cls = size === "md" ? "size-5" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex text-accent" role="img" aria-label={`Rated ${r.toFixed(1)} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) =>
          r >= i ? (
            <FaStar key={i} className={cls} aria-hidden />
          ) : r >= i - 0.5 ? (
            <FaStarHalfStroke key={i} className={cls} aria-hidden />
          ) : (
            <FaRegStar key={i} className={cls} aria-hidden />
          ),
        )}
      </span>
      {count !== undefined && <span className="text-xs text-slate-500">({count})</span>}
    </span>
  );
}
