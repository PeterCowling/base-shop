import { NextRequest, NextResponse } from "next/server";
import { requireShopIdFromHeaders } from "@acme/shared-utils";
import { getOrderById } from "@platform-core/orders";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  let shopId: string;
  try {
    shopId = requireShopIdFromHeaders(req.headers);
  } catch {
    return NextResponse.json({ error: "Missing shop context" }, { status: 400 }); // i18n-exempt -- ABC-123 machine-readable API error
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 }); // i18n-exempt -- ABC-123 machine-readable API error
  }

  const order = await getOrderById(shopId, orderId);
  return NextResponse.json({
    ok: true,
    orderId,
    finalized: Boolean(order),
  });
}
