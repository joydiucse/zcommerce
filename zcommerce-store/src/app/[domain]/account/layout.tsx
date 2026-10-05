import type { Metadata } from "next";
import { storeApi } from "@/lib/api";
import { robotsFor } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const settings = await storeApi((await params).domain).getSettings();
  // Account area is never indexed.
  return { robots: robotsFor(settings, true) };
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
