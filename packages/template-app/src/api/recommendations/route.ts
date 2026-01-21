// packages/template-app/src/api/recommendations/route.ts
import { NextResponse } from "next/server";

import { PRODUCTS } from "@acme/platform-core/products";
import type { RecommendationPreset } from "@acme/types";

export const dynamic = "force-dynamic"; // allow runtime selection

function selectByPreset(preset: RecommendationPreset | undefined) {
  const items = [...PRODUCTS];
  switch (preset) {
    case "new":
      return items.sort((a, b) => (b.id > a.id ? 1 : -1));
    case "bestsellers":
      return items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case "clearance":
      return items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case "limited":
      return items.filter((p) => /limited|rare|exclusive/i.test(p.title));
    case "featured":
    default:
      return items;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const preset = (url.searchParams.get("preset") || undefined) as RecommendationPreset | undefined;
    const limit = Number(url.searchParams.get("limit") || "12");
    const list = selectByPreset(preset).slice(0, Math.max(1, Math.min(50, limit)));
    return new NextResponse(JSON.stringify(list), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // short cache for demo; adjust in production
        "cache-control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120", // i18n-exempt -- ABC-123: HTTP cache header value
      },
    });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 }); // i18n-exempt -- ABC-123: machine-readable API error
  }
}
