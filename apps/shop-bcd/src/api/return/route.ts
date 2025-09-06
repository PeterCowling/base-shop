import "@acme/zod-utils/initZod";
import { stripe } from "@acme/stripe";
import { computeDamageFee } from "@platform-core/pricing";
import {
  markRefunded,
  markReturned,
  readOrders,
} from "@platform-core/repositories/rentalOrders.server";
import { readShop } from "@platform-core/repositories/shops.server";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const schema = z
  .object({
    sessionId: z.string(),
    damage: z.union([z.string(), z.number()]).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }
  const { sessionId, damage } = parsed.data;

  const orders = await readOrders("bcd");
  const order = orders.find((o) => o.sessionId === sessionId);
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

  const shop = await readShop("bcd");
  const coverageCodes =
    session.metadata?.coverage?.split(",").filter(Boolean) ?? [];

  try {
    const damageFee = await computeDamageFee(
      damage,
      deposit,
      coverageCodes,
      shop.coverageIncluded,
    );
    const refund = Math.max(deposit - damageFee, 0);
    if (refund > 0) {
      await stripe.refunds.create({ payment_intent: pi, amount: refund * 100 });
      await markRefunded("bcd", sessionId);
    }
    await markReturned(
      "bcd",
      sessionId,
      damageFee ? damageFee : undefined,
    );
  } catch (err) {
    console.error("Failed to process refund", err);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
