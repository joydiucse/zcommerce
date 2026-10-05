import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "My account", alternates: { canonical: "/account" } };

export default function AccountPage() {
  return (
    <AccountShell title="My account">
      <ProfileForm />
    </AccountShell>
  );
}
