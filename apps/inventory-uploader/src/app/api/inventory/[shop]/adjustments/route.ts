import { type NextRequest, NextResponse } from "next/server";

import {
  applyStockAdjustment,
  listStockAdjustments,
} from "@acme/platform-core/repositories/stockAdjustments.server";

import { apiError, parseSafeLimit } from "../../../../../lib/api-helpers";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const { shop } = await context.params;
  const { searchParams } = new URL(req.url);
  const safeLimit = parseSafeLimit(searchParams);

  try {
    const events = await listStockAdjustments(shop, { limit: safeLimit });
    return NextResponse.json({ ok: true, events });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const { shop } = await context.params;
  const url = new URL(req.url);
  const dryRunParam = url.searchParams.get("dryRun") === "true";

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    // Allow ?dryRun=true to override body field
    const payload = dryRunParam ? { ...(body ?? {}), dryRun: true } : (body ?? {});
    const result = await applyStockAdjustment(shop, payload);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (err) {
    return apiError(err);
  }
}
