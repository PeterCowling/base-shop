// apps/shop-bcd/src/app/api/orders/route.ts
import { getCustomerSession } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { NextResponse } from "next/server";
import shop from "../../../../shop.json";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const orders = await getOrdersForCustomer(shop.id, session.customerId);
    return NextResponse.json({ ok: true, orders });
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
