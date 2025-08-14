import { stripe } from "@acme/stripe";
import {
  markRefunded,
  markReturned,
} from "@platform-core/repositories/rentalOrders.server";
import { computeDamageFee } from "@platform-core/src/pricing";
import { readShop } from "@platform-core/src/repositories/shops.server";
import { coreEnv } from "@acme/config/env/core";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
const SHOP_ID = coreEnv.NEXT_PUBLIC_DEFAULT_SHOP || "shop";

export async function POST(req: NextRequest) {
  const { sessionId, damage } = (await req.json()) as {
    sessionId?: string;
    damage?: string | number;
  };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const shop = await readShop(SHOP_ID);
  if (!shop.returnsEnabled || shop.type !== "rental") {
    return NextResponse.json({ error: "Returns disabled" }, { status: 403 });
  }

  const order = await markReturned(SHOP_ID, sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  const deposit = Number(session.metadata?.depositTotal ?? 0);
  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!deposit || !pi) {
    return NextResponse.json({ ok: false, message: "No deposit found" });
  }

  const damageFee = await computeDamageFee(damage, deposit);
  if (damageFee) {
    await markReturned(SHOP_ID, sessionId, damageFee);
  }
  const refund = Math.max(deposit - damageFee, 0);
  if (refund > 0) {
    await stripe.refunds.create({ payment_intent: pi, amount: refund * 100 });
    await markRefunded(SHOP_ID, sessionId);
  }

  return NextResponse.json({ ok: true });
}
