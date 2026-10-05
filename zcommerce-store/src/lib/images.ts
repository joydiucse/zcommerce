/**
 * next/image optimisation is used for https hosts (any) and picsum. Local/private hosts
 * (e.g. http://localhost:4000/storage) are served unoptimised, because Next 16 blocks
 * optimising images that resolve to local IPs by default.
 */
export function imageProps(url: string | null | undefined): { src: string; unoptimized: boolean } {
  const src = url || "";
  if (!src) return { src: "/placeholder.svg", unoptimized: true };
  if (src.startsWith("/")) return { src, unoptimized: src.endsWith(".svg") };
  try {
    const u = new URL(src);
    const local = /^(localhost|127\.|10\.|192\.168\.|0\.0\.0\.0|\[::1\])/.test(u.hostname);
    if (u.protocol === "https:" && !local) return { src, unoptimized: false };
    return { src, unoptimized: true };
  } catch {
    return { src: "/placeholder.svg", unoptimized: true };
  }
}
