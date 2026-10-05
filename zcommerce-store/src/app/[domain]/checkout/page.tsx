import type { Metadata } from "next";
import { Checkout } from "@/components/checkout/CheckoutForm";
import { storeApi } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  return buildMetadata(storeApi((await params).domain), { title: "Checkout", path: "/checkout", noindex: true });
}

export default function CheckoutPage() {
  return (
    <div className="container-store py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">Checkout</h1>
      <Checkout />
    </div>
  );
}
