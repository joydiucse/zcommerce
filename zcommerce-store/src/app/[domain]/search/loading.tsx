import { ProductGridSkeleton } from "@/components/product/ProductCard";

export default function Loading() {
  return (
    <div className="container-store py-10" aria-busy="true" aria-label="Searching">
      <div className="skeleton h-9 w-72" />
      <div className="skeleton mt-6 h-12 max-w-xl" />
      <div className="mt-10">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
