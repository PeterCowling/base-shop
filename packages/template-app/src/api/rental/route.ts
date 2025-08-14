import { stripe } from "@acme/stripe";
import { readShop } from "@platform-core/repositories/shops.server";
import {
  addOrder,
  markReturned,
} from "@platform-core/repositories/rentalOrders.server";
import { readInventory } from "@platform-core/repositories/inventory.server";
import { readRepo as readProducts } from "@platform-core/repositories/products.server";
import { reserveRentalInventory } from "@platform-core/orders/rentalAllocation";
import { computeDamageFee } from "@platform-core/src/pricing";
import { NextRequest, NextResponse } from "next/server";

const SHOP_ID = "bcd";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  const shop = await readShop(SHOP_ID);
  if (!shop.rentalInventoryAllocation) {
    return NextResponse.json(
      { error: "Rental allocation disabled" },
      { status: 403 },
    );
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const deposit = Number(session.metadata?.depositTotal ?? 0);
  const expected = session.metadata?.returnDate || undefined;

  const orderItems: Array<{ sku: string; from: string; to: string }> =
    session.metadata?.items ? JSON.parse(session.metadata.items) : [];
  if (orderItems.length) {
    const [inventory, products] = await Promise.all([
      readInventory(SHOP_ID),
      readProducts(SHOP_ID),
    ]);
    for (const { sku, from, to } of orderItems) {
      const skuInfo = products.find((p) => p.sku === sku);
      if (!skuInfo) continue;
      const items = inventory.filter((i) => i.sku === sku);
      await reserveRentalInventory(SHOP_ID, items as any, skuInfo as any, from, to);
    }
  }
  await addOrder(SHOP_ID, sessionId, deposit, expected);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { sessionId, damage } = (await req.json()) as {
    sessionId?: string;
    damage?: string | number;
  };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  const shop = await readShop(SHOP_ID);
  if (!shop.rentalInventoryAllocation) {
    return NextResponse.json(
      { error: "Rental allocation disabled" },
      { status: 403 },
    );
  }
  const order = await markReturned(SHOP_ID, sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const damageFee = await computeDamageFee(damage, order.deposit);
  if (damageFee) {
    await markReturned(SHOP_ID, sessionId, damageFee);
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (pi && order.deposit) {
    const refund = Math.max(order.deposit - damageFee, 0);
    if (refund > 0) {
      await stripe.refunds.create({ payment_intent: pi, amount: refund * 100 });
    }
  }
  return NextResponse.json({ ok: true });
}
