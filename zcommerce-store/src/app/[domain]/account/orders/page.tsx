import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { OrdersList } from "@/components/account/OrdersList";

export const metadata: Metadata = { title: "My orders", alternates: { canonical: "/account/orders" } };

export default function OrdersPage() {
  return (
    <AccountShell title="My orders">
      <OrdersList />
    </AccountShell>
  );
}
