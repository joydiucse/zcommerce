import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { storeApi } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  return buildMetadata(storeApi((await params).domain), { title: "Shopping cart", path: "/cart", noindex: true });
}

export default function CartPage() {
  return (
    <div className="container-store py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">Shopping cart</h1>
      <CartView />
    </div>
  );
}
