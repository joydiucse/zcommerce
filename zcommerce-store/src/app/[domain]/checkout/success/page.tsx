import type { Metadata } from "next";
import { OrderSuccess } from "@/components/checkout/OrderSuccess";
import type { RawSearchParams } from "@/lib/listing";
import { storeApi } from "@/lib/api";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 0;

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  return buildMetadata(storeApi((await params).domain), { title: "Order confirmed", path: "/checkout/success", noindex: true });
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function SuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <div className="container-store py-12">
      <OrderSuccess orderNumber={first(sp.order)} email={first(sp.email)} />
    </div>
  );
}
