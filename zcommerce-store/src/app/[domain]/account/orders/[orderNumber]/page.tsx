import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountOrder } from "@/components/account/OrdersList";

type Props = { params: Promise<{ orderNumber: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order #${decodeURIComponent(orderNumber)}` };
}

export default async function OrderPage({ params }: Props) {
  const { orderNumber } = await params;
  const num = decodeURIComponent(orderNumber);
  return (
    <AccountShell title={`Order #${num}`}>
      <AccountOrder orderNumber={num} />
    </AccountShell>
  );
}
