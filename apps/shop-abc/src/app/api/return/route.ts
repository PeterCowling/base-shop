// apps/shop-abc/src/app/api/return/route.ts

import { stripe } from "@/lib/stripeServer";
import {
  markRefunded,
  markReturned,
} from "@platform-core/repositories/rentalOrders.server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { sessionId, damageFee } = (await req.json()) as {
    sessionId?: string;
    damageFee?: number;
  };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const order = await markReturned("abc", sessionId, damageFee);
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

  const refund = Math.max(deposit - (damageFee ?? 0), 0);
  if (refund > 0) {
    await stripe.refunds.create({ payment_intent: pi, amount: refund * 100 });
    await markRefunded("abc", sessionId);
  }

  return NextResponse.json({ ok: true });
}
