import { markReturned } from "@platform-core/repositories/rentalOrders.server";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import { readShop } from "@platform-core/src/repositories/shops.server";
import { coreEnv } from "@acme/config/env/core";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
const SHOP_ID = coreEnv.NEXT_PUBLIC_DEFAULT_SHOP || "shop";

export async function POST(req: NextRequest) {
  const shop = await readShop(SHOP_ID);
  if (!shop.returnsEnabled || shop.type !== "rental") {
    return NextResponse.json({ error: "Returns disabled" }, { status: 403 });
  }
  const cfg = await getReturnLogistics();
  if (!cfg.mobileApp) {
    return NextResponse.json({ error: "Mobile returns disabled" }, { status: 403 });
  }
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  const order = await markReturned(SHOP_ID, sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

