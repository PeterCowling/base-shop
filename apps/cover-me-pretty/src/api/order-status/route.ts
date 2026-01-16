// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
import { NextRequest, NextResponse } from "next/server";
import { requireShopIdFromHeaders } from "@acme/shared-utils";
import { getOrderById } from "@platform-core/orders";
import shop from "../../../shop.json";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  let shopId: string;
  try {
    shopId = requireShopIdFromHeaders(req.headers);
  } catch {
    return NextResponse.json(
      { error: "Missing shop context" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
      { status: 400 },
    );
  }
  if (shopId !== shop.id) {
    return NextResponse.json(
      { error: "Invalid shop context" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
      { status: 400 },
    );
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json(
      { error: "Missing orderId" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
      { status: 400 },
    );
  }

  const order = await getOrderById(shopId, orderId);
  return NextResponse.json({
    ok: true,
    orderId,
    finalized: Boolean(order),
  });
}
