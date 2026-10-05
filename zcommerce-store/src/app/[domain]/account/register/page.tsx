import type { Metadata } from "next";
import { AuthForm } from "@/components/account/AuthForm";
import type { RawSearchParams } from "@/lib/listing";

export const metadata: Metadata = { title: "Create account", alternates: { canonical: "/account/register" } };

export const revalidate = 0;

type Props = { searchParams: Promise<RawSearchParams> };

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  const next = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  return (
    <div className="container-store py-12 sm:py-16">
      <AuthForm mode="register" next={next} />
    </div>
  );
}
