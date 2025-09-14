import "@acme/zod-utils/initZod";

import { stripe } from "@acme/stripe";
import { computeDamageFee } from "@platform-core/pricing";
import {
  addOrder,
  markReturned,
  readOrders,
} from "@platform-core/repositories/rentalOrders.server";
import { readShop } from "@platform-core/repositories/shops.server";
import type { RentalOrder } from "@acme/types";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

export const runtime = "edge";

const RentalSchema = z.object({ sessionId: z.string() }).strict();
const ReturnSchema = z
  .object({
    sessionId: z.string(),
    damage: z.union([z.string(), z.number()]).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, RentalSchema, "1mb");
  if ("response" in parsed) return parsed.response;
  const { sessionId } = parsed.data;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const deposit = Number(session.metadata?.depositTotal ?? 0);
  const expected = session.metadata?.returnDate || undefined;
  await addOrder("bcd", sessionId, deposit, expected);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const parsed = await parseJsonBody(req, ReturnSchema, "1mb");
  if ("response" in parsed) return parsed.response;
  const { sessionId, damage } = parsed.data;

  let alreadyReturned = false;
  let order: RentalOrder | undefined;
  if (typeof readOrders === "function") {
    const orders = await readOrders("bcd");
    order = orders.find((o) => o.sessionId === sessionId);
  } else {
    order = await markReturned("bcd", sessionId);
    alreadyReturned = true;
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const shop = await readShop("bcd");
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  let coverageCodes =
    session.metadata?.coverage?.split(",").filter(Boolean) ?? [];
  if (shop.coverageIncluded && typeof damage === "string") {
    coverageCodes = Array.from(new Set([...coverageCodes, damage]));
  }
  const deposit = order.deposit ?? 0;
  const damageFee = await computeDamageFee(
    damage,
    deposit,
    coverageCodes,
    shop.coverageIncluded,
  );
  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  const refund = pi && deposit ? Math.max(deposit - damageFee, 0) : 0;

  try {
    if (refund > 0) {
      await stripe.refunds.create({ payment_intent: pi!, amount: refund * 100 });
    }
    let clientSecret: string | undefined;
    if (damageFee > deposit) {
      const remaining = damageFee - deposit;
      const intent = await stripe.paymentIntents.create({
        amount: remaining * 100,
        currency: session.currency ?? "usd",
        ...(session.customer ? { customer: session.customer as string } : {}),
        metadata: { sessionId, purpose: "damage_fee" },
      });
      clientSecret = intent.client_secret ?? undefined;
    }
    if (!alreadyReturned) {
      await markReturned("bcd", sessionId);
    }
    if (damageFee > 0) {
      await markReturned("bcd", sessionId, damageFee);
    }
    return NextResponse.json(
      { ok: true, ...(clientSecret ? { clientSecret } : {}) },
      { status: 200 },
    );
  } catch (err) {
    console.error("Failed to process payment", err);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 502 },
    );
  }
}
