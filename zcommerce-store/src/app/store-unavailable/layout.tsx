import type { Metadata } from "next";
import { fontVar } from "@/lib/fonts";
import "../globals.css";

/** Root layout for hosts that don't map to any store (no tenant theme or settings here). */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ "--font-store": fontVar("inter") } as React.CSSProperties}>
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
