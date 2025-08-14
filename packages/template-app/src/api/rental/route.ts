import { stripe } from "@acme/stripe";
import {
  addOrder,
  markReturned,
} from "@platform-core/repositories/rentalOrders.server";
import { readInventory } from "@platform-core/repositories/inventory.server";
import { readRepo as readProducts } from "@platform-core/repositories/products.server";
import { reserveRentalInventory } from "@platform-core/orders/rentalAllocation";
import { computeDamageFee } from "@platform-core/src/pricing";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const deposit = Number(session.metadata?.depositTotal ?? 0);
  const expected = session.metadata?.returnDate || undefined;

  const orderItems: Array<{ sku: string; from: string; to: string }> =
    session.metadata?.items ? JSON.parse(session.metadata.items) : [];
  if (orderItems.length) {
    const [inventory, products] = await Promise.all([
      readInventory("bcd"),
      readProducts("bcd"),
    ]);
    for (const { sku, from, to } of orderItems) {
      const skuInfo = products.find((p) => p.sku === sku);
      if (!skuInfo) continue;
      const items = inventory.filter((i) => i.sku === sku);
      await reserveRentalInventory("bcd", items as any, skuInfo as any, from, to);
    }
  }
  await addOrder("bcd", sessionId, deposit, expected);
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
  const order = await markReturned("bcd", sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const coverageCodes = session.metadata?.coverage?.split(",").filter(Boolean) ?? [];
  const damageFee = await computeDamageFee(
    damage,
    order.deposit,
    coverageCodes,
  );
  if (damageFee) {
    await markReturned("bcd", sessionId, damageFee);
  }

  let clientSecret: string | undefined;
  if (damageFee > order.deposit) {
    const remaining = damageFee - order.deposit;
    const intent = await stripe.paymentIntents.create({
      amount: remaining * 100,
      currency: session.currency ?? "usd",
      ...(session.customer ? { customer: session.customer as string } : {}),
      metadata: { sessionId, purpose: "damage_fee" },
    });
    clientSecret = intent.client_secret ?? undefined;
  }

  return NextResponse.json(
    { ok: true, ...(clientSecret ? { clientSecret } : {}) },
    { status: 200 },
  );
}
