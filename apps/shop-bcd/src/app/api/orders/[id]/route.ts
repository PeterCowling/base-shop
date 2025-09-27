// apps/shop-bcd/src/app/api/orders/[id]/route.ts
import { getCustomerSession } from "@auth";
import {
  getOrdersForCustomer,
  markCancelled,
  markDelivered,
  refundOrder,
} from "@platform-core/orders";
import { NextResponse } from "next/server";
import shop from "../../../../../shop.json";

// @auth relies on Node APIs, so use Node runtime
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // i18n-exempt: HTTP status label; UI translates by status
  }
  try {
    const orders = await getOrdersForCustomer(shop.id, session.customerId);
    const order = orders.find((o) => o.id === params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 }); // i18n-exempt: API error token; UI maps to translation
    }
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // i18n-exempt: HTTP status label; UI translates by status
  }
  let status: unknown;
  let amount: unknown;
  try {
    ({ status, amount } = (await req.json()) as {
      status?: string;
      amount?: number;
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 }); // i18n-exempt: API error token; UI maps to translation
  }
  if (
    status === "refunded" &&
    amount !== undefined &&
    (typeof amount !== "number" || Number.isNaN(amount))
  ) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 }); // i18n-exempt: API error token; UI maps to translation
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
    return NextResponse.json({ error: "Invalid status" }, { status: 400 }); // i18n-exempt: API error token; UI maps to translation
  }
  try {
    const order = await mutate();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 }); // i18n-exempt: API error token; UI maps to translation
    }
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
