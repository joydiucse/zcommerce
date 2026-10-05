import { ImageResponse } from "next/og";
import { safeColor } from "./site";
import type { StoreSettings } from "./types";

export const OG_SIZE = { width: 1200, height: 630 };

/** Fetches a remote image and inlines it as a data URL; returns null on any failure. */
export async function inlineImage(url: string | null | undefined): Promise<string | null> {
  if (!url || !/^https?:\/\//.test(url)) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") || "").split(";")[0];
    if (!/^image\/(png|jpe?g|gif)$/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 4_000_000) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export function ogImage({
  settings,
  title,
  subtitle,
  image,
  badge,
}: {
  settings: StoreSettings;
  title: string;
  subtitle?: string;
  image?: string | null;
  badge?: string;
}) {
  const primary = safeColor(settings.theme.primary_color, "#4f46e5");
  const secondary = safeColor(settings.theme.secondary_color, "#0f172a");
  const accent = safeColor(settings.theme.accent_color, "#f59e0b");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: `linear-gradient(135deg, ${secondary} 0%, ${primary} 100%)`,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "white",
                color: primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 800,
              }}
            >
              {settings.general.store_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, opacity: 0.95 }}>{settings.general.store_name}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: title.length > 40 ? 52 : 64, fontWeight: 800, lineHeight: 1.1, maxWidth: image ? 560 : 1000 }}>
              {title.length > 90 ? `${title.slice(0, 88)}…` : title}
            </div>
            {subtitle && <div style={{ fontSize: 28, opacity: 0.85, maxWidth: image ? 560 : 1000 }}>{subtitle}</div>}
            {badge && (
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    background: accent,
                    color: "#0f172a",
                    fontSize: 36,
                    fontWeight: 800,
                    padding: "10px 26px",
                    borderRadius: 999,
                  }}
                >
                  {badge}
                </div>
              </div>
            )}
          </div>
        </div>
        {image && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, paddingLeft: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" width={500} height={500} style={{ borderRadius: 32, objectFit: "cover", width: 500, height: 500 }} />
          </div>
        )}
      </div>
    ),
    OG_SIZE,
  );
}
