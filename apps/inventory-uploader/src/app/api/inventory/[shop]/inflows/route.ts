import { type NextRequest, NextResponse } from "next/server";

import {
  listStockInflows,
  receiveStockInflow,
} from "@acme/platform-core/repositories/stockInflows.server";

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
    const events = await listStockInflows(shop, { limit: safeLimit });
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
    const body: unknown = await req.json().catch(() => null);
    const bodyObj: Record<string, unknown> = body !== null && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
    const payload = dryRunParam ? { ...bodyObj, dryRun: true } : bodyObj;
    const result = await receiveStockInflow(shop, payload);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (err) {
    return apiError(err);
  }
}
