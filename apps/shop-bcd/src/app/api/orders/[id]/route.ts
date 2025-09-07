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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const orders = await getOrdersForCustomer(shop.id, session.customerId);
    const order = orders.find((o) => o.id === params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let status: unknown;
  let amount: unknown;
  try {
    ({ status, amount } = (await req.json()) as {
      status?: string;
      amount?: number;
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (status === "refunded" && amount !== undefined) {
    if (typeof amount !== "number" || Number.isNaN(amount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
  }
  const mutate =
    status === "cancelled"
      ? () => markCancelled(shop.id, params.id)
      : status === "delivered"
        ? () => markDelivered(shop.id, params.id)
        : status === "refunded"
          ? () =>
              typeof amount === "number"
                ? refundOrder(shop.id, params.id, amount)
                : refundOrder(shop.id, params.id)
          : null;
  if (!mutate) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  try {
    const order = await mutate();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

