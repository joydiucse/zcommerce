import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PlatformLanding } from "@/components/platform/PlatformLanding";
import { getPlatform } from "@/lib/api";

/**
 * Target of src/proxy.ts when the request host has no usable store.
 * - suspended → rendered here (the proxy sets HTTP 503)
 * - anything else → notFound(), rendered by ../not-found.tsx with HTTP 404
 */
type Props = { params: Promise<{ reason: string }> };

export const dynamic = "force-dynamic";

export default async function StoreUnavailablePage({ params }: Props) {
  const { reason } = await params;
  if (reason !== "suspended") notFound();
  const [h, platform] = await Promise.all([headers(), getPlatform()]);
  return <PlatformLanding kind="suspended" host={h.get("x-zc-store-host") ?? undefined} platform={platform} />;
}
