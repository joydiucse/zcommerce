import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * On-demand cache busting for the admin panel / backend.
 *
 * POST /api/revalidate
 *   Header `x-revalidate-secret: <REVALIDATE_SECRET>` (or `?secret=` / body.secret)
 *   Body (JSON, all optional):
 *     { "tags": ["settings", "products", "product:<slug>"], "paths": ["/", "/products/<slug>"], "type": "layout" | "page" }
 *   With an empty body everything is revalidated (layout of "/").
 *
 * Tags used by the storefront: settings, products, product:<slug>, reviews, reviews:<slug>,
 * categories, category:<slug>, brands, brand:<slug>, pages, page:<slug>, search, sitemap, tenant:<slug|host>.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json({ success: false, error: { code: "NOT_CONFIGURED", message: "REVALIDATE_SECRET is not set" } }, { status: 500 });
  }
  let body: { secret?: string; tags?: unknown; tag?: unknown; paths?: unknown; path?: unknown; type?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const secret = req.headers.get("x-revalidate-secret") || req.nextUrl.searchParams.get("secret") || body.secret;
  if (secret !== expected) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHENTICATED", message: "Invalid secret" } }, { status: 401 });
  }

  const list = (v: unknown) => (Array.isArray(v) ? v : v ? [v] : []).filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 256);
  const tags = [...list(body.tags), ...list(body.tag), ...req.nextUrl.searchParams.getAll("tag")];
  const paths = [...list(body.paths), ...list(body.path), ...req.nextUrl.searchParams.getAll("path")];
  const type = body.type === "page" || body.type === "layout" ? body.type : undefined;

  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  for (const path of paths) {
    if (type) revalidatePath(path, type);
    else revalidatePath(path);
  }
  if (!tags.length && !paths.length) revalidatePath("/", "layout");

  return NextResponse.json({
    success: true,
    data: { revalidated: true, tags, paths: tags.length || paths.length ? paths : ["/ (layout)"], now: Date.now() },
  });
}

export function GET() {
  return NextResponse.json({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Use POST" } }, { status: 405 });
}
