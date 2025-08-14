import { markReturned } from "@platform-core/repositories/rentalOrders.server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { code } = (await req.json().catch(() => ({}))) as {
    code?: string;
  };
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }
  const order = await markReturned("bcd", code);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
