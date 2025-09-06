// apps/shop-bcd/src/app/api/orders/[id]/route.ts
import { getCustomerSession } from "@auth";
import {
  getOrdersForCustomer,
  markCancelled,
  markDelivered,
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
  try {
    ({ status } = (await req.json()) as { status?: string });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const mutate =
    status === "cancelled"
      ? markCancelled
      : status === "delivered"
        ? markDelivered
        : null;
  if (!mutate) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  try {
    const order = await mutate(shop.id, params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

