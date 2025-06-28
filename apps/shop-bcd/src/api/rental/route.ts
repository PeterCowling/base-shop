import { stripe } from "@/lib/stripeServer";
import {
  addOrder,
  markReturned,
} from "@platform-core/repositories/rentalOrders";
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
  await addOrder("bcd", sessionId, deposit, expected);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { sessionId, damageFee } = (await req.json()) as {
    sessionId?: string;
    damageFee?: number;
  };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  const order = await markReturned("bcd", sessionId, damageFee);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (pi && order.deposit) {
    const refund = Math.max(order.deposit - (damageFee ?? 0), 0);
    if (refund > 0) {
      await stripe.refunds.create({ payment_intent: pi, amount: refund * 100 });
    }
  }
  return NextResponse.json({ ok: true });
}
