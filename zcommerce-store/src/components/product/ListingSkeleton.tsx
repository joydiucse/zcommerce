import { ProductGridSkeleton } from "./ProductCard";

export function ListingSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10" aria-busy="true" aria-label="Loading products">
      <div className="hidden space-y-3 lg:block">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-6" />
        ))}
      </div>
      <div>
        <div className="skeleton mb-5 h-10 w-full" />
        <ProductGridSkeleton count={9} />
      </div>
    </div>
  );
}
