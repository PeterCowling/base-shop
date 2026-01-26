import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { PRODUCTS } from "@acme/platform-core/products/index";

export const runtime = "edge";

const Query = z.object({ seed: z.string().optional(), limit: z.coerce.number().int().positive().max(20).default(4) });

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = Query.safeParse({ seed: url.searchParams.get("seed") || undefined, limit: url.searchParams.get("limit") || undefined });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const { seed, limit } = parsed.data;
  const items = PRODUCTS.filter((p) => !seed || p.slug !== seed).slice(0, limit);
  return NextResponse.json({ items });
}
