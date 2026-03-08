import { type NextRequest, NextResponse } from "next/server";

import {
  listStockInflows,
  receiveStockInflow,
} from "@acme/platform-core/repositories/stockInflows.server";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const { shop } = await context.params;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "50");
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(250, Math.floor(limit))) : 50;

  try {
    const events = await listStockInflows(shop, { limit: safeLimit });
    return NextResponse.json({ ok: true, events });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
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
    const payload = dryRunParam ? { ...(body ?? {}), dryRun: true } : (body ?? {});
    const result = await receiveStockInflow(shop, payload);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
