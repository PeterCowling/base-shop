// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
// apps/cover-me-pretty/src/app/api/orders/[id]/route.ts
import { NextResponse } from "next/server";

import { getCustomerSession } from "@acme/auth";
import {
  getOrdersForCustomer,
  markCancelled,
  markDelivered,
  refundOrder,
} from "@acme/platform-core/orders";

import shop from "../../../../../shop.json";

// @acme/auth relies on Node APIs, so use Node runtime
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // i18n-exempt -- I18N-123 HTTP status label; UI translates by status [ttl=2025-06-30]
  }
  try {
    const orders = await getOrdersForCustomer(shop.id, session.customerId);
    const order = orders.find((o) => o.id === params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 }); // i18n-exempt -- I18N-123 API error token; UI maps to translation [ttl=2025-06-30]
    }
    return NextResponse.json({ order });
  } catch (err) {
    console.error("[api/orders] GET error:", err); // i18n-exempt -- server log
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 }); // i18n-exempt -- generic error
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // i18n-exempt -- I18N-123 HTTP status label; UI translates by status [ttl=2025-06-30]
  }
  let status: unknown;
  let amount: unknown;
  try {
    ({ status, amount } = (await req.json()) as {
      status?: string;
      amount?: number;
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 }); // i18n-exempt -- I18N-123 API error token; UI maps to translation [ttl=2025-06-30]
  }
  if (
    status === "refunded" &&
    amount !== undefined &&
    (typeof amount !== "number" || Number.isNaN(amount))
  ) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 }); // i18n-exempt -- I18N-123 API error token; UI maps to translation [ttl=2025-06-30]
  }
  const mutate =
    status === "cancelled"
      ? () => markCancelled(shop.id, params.id)
      : status === "delivered"
        ? () => markDelivered(shop.id, params.id)
        : status === "refunded"
          ? () =>
              refundOrder(
                shop.id,
                params.id,
                typeof amount === "number" ? amount : undefined,
              )
          : null;
  if (!mutate) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 }); // i18n-exempt -- I18N-123 API error token; UI maps to translation [ttl=2025-06-30]
  }
  try {
    const order = await mutate();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 }); // i18n-exempt -- I18N-123 API error token; UI maps to translation [ttl=2025-06-30]
    }
    return NextResponse.json({ order });
  } catch (err) {
    console.error("[api/orders] PATCH error:", err); // i18n-exempt -- server log
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 }); // i18n-exempt -- generic error
  }
}
