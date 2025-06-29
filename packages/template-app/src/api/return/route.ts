import { stripe } from "@/lib/stripeServer";
import { computeDamageFee } from "@platform-core/pricing";
import {
  markRefunded,
  markReturned,
} from "@platform-core/repositories/rentalOrders";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
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
    await markReturned("bcd", sessionId, damageFee);
  }
  const refund = Math.max(deposit - damageFee, 0);
  if (refund > 0) {
    await stripe.refunds.create({ payment_intent: pi, amount: refund * 100 });
    await markRefunded("bcd", sessionId);
  }

  return NextResponse.json({ ok: true });
}
