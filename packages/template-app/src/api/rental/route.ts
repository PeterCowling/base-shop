import { stripe } from "@acme/stripe";
import type { SKU } from "@acme/types";
import type { InventoryItem } from "@platform-core/types/inventory";
import { readShop } from "@platform-core/repositories/shops.server";
import {
  addOrder,
  markReturned,
  markRefunded,
} from "@platform-core/repositories/rentalOrders.server";
import { readInventory } from "@platform-core/repositories/inventory.server";
import { readRepo as readProducts } from "@platform-core/repositories/products.server";
import { reserveRentalInventory } from "@platform-core/orders/rentalAllocation";
import { computeDamageFee } from "@platform-core/pricing";
import { NextRequest, NextResponse } from "next/server";

const SHOP_ID = "bcd";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 }); // i18n-exempt -- ABC-123: machine-readable API error
  }
  const shop = await readShop(SHOP_ID);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const deposit = Number(session.metadata?.depositTotal ?? 0);
  const expected = session.metadata?.returnDate || undefined;

  const orderItems: Array<{ sku: string; from: string; to: string }> =
    session.metadata?.items ? JSON.parse(session.metadata.items) : [];
  if (shop.rentalInventoryAllocation && orderItems.length) {
    try {
      const [inventory, products]: [InventoryItem[], SKU[]] =
        await Promise.all([
          readInventory(SHOP_ID),
          readProducts<SKU>(SHOP_ID),
        ]);
      for (const { sku, from, to } of orderItems) {
        const skuInfo = products.find(
          (p: SKU) => p.id === sku || p.slug === sku,
        );
        if (!skuInfo) continue;
        const items = inventory.filter((i) => i.sku === sku);
        await reserveRentalInventory(SHOP_ID, items, skuInfo, from, to);
      }
    } catch (err) {
      console.error("Rental inventory reservation failed", err); // i18n-exempt -- OPS-3201 non-UX log [ttl=2026-12-31]
      return NextResponse.json(
        { error: "Inventory unavailable" }, // i18n-exempt -- OPS-3201 machine-readable API error [ttl=2026-12-31]
        { status: 503 },
      );
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
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 }); // i18n-exempt -- ABC-123: machine-readable API error
  }
  const shop = await readShop(SHOP_ID);
  const order = await markReturned(SHOP_ID, sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 }); // i18n-exempt -- ABC-123: machine-readable API error
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  const coverageCodes =
    session.metadata?.coverage?.split(",").filter(Boolean) ?? [];
  const damageFee = await computeDamageFee(
    damage,
    order.deposit,
    coverageCodes,
    shop.coverageIncluded,
  );
  if (damageFee) {
    await markReturned(SHOP_ID, sessionId, damageFee);
  }

  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  const refund = Math.max(order.deposit - damageFee, 0);
  if (refund > 0 && stripe.refunds?.create) {
    await stripe.refunds.create({ payment_intent: pi, amount: refund * 100 });
    await markRefunded(SHOP_ID, sessionId);
  }

  let clientSecret: string | undefined;
  if (damageFee > order.deposit && stripe.paymentIntents?.create) {
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
