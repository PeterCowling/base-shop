import { markReturned } from "@platform-core/repositories/rentalOrders.server";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const cfg = await getReturnLogistics();
  if (!cfg.mobileApp) {
    return NextResponse.json({ error: "Mobile returns disabled" }, { status: 403 });
  }
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  const order = await markReturned("bcd", sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

