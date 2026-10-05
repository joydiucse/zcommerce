import type { Metadata } from "next";
import { headers } from "next/headers";
import { PlatformLanding, UNAVAILABLE_COPY } from "@/components/platform/PlatformLanding";
import { getPlatform } from "@/lib/api";

export const metadata: Metadata = {
  title: UNAVAILABLE_COPY.not_found.title,
  robots: { index: false, follow: false },
};

/** "Store not found" (HTTP 404): the request host doesn't match any tenant's store URL. */
export default async function StoreNotFound() {
  const [h, platform] = await Promise.all([headers(), getPlatform()]);
  return <PlatformLanding kind="not_found" host={h.get("x-zc-store-host") ?? undefined} platform={platform} />;
}
