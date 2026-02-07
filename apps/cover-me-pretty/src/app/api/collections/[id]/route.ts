// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
import { NextResponse } from "next/server";

import { PRODUCTS, type SKU } from "@acme/platform-core/products";

type SortKey = keyof Pick<SKU, "price" | "title" | "stock">;

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const sortParam = searchParams.get("sort");
    const limit = limitParam ? Math.max(0, Number(limitParam)) : undefined;
    const sort = (sortParam as SortKey | null) ?? null;

    const id = decodeURIComponent(params.id);

    let items = PRODUCTS.filter((p) => p.stock > 0);
    // Minimal mapping: if id matches an actual SKU id, return that one; otherwise return all
    const match = items.find((p) => p.id === id || p.slug === id);
    if (match) items = [match];

    if (sort && (sort === "price" || sort === "title" || sort === "stock")) {
      items = [...items].sort((a, b) => {
        const av = a[sort]! as unknown as number | string;
        const bv = b[sort]! as unknown as number | string;
        if (typeof av === "number" && typeof bv === "number") return av - bv;
        return String(av).localeCompare(String(bv));
      });
    }
    if (typeof limit === "number" && Number.isFinite(limit)) items = items.slice(0, limit);

    const res = NextResponse.json({ items }, { status: 200 });
    // Cache-Control for ISR-like behavior at the edge/CDN
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=60", // i18n-exempt -- I18N-123 header value is technical, not user-facing copy [ttl=2025-06-30]
    );
    return res;
  } catch {
    return NextResponse.json(
      { error: "Failed to load collection" }, // i18n-exempt -- I18N-123 API error string; caller/UI will localize [ttl=2025-06-30]
      { status: 500 },
    );
  }
}
