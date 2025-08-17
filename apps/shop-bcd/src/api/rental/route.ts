import "@acme/zod-utils/initZod";

import { stripe } from "@acme/stripe";
import { computeDamageFee } from "@platform-core/pricing";
import {
  addOrder,
  markReturned,
} from "@platform-core/repositories/rentalOrders.server";
import { readShop } from "@platform-core/repositories/shops.server";

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
  const order = await markReturned("bcd", sessionId);
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
  const damageFee = await computeDamageFee(
    damage,
    order.deposit,
    coverageCodes,
    shop.coverageIncluded,
  );
  if (damageFee) {
    await markReturned("bcd", sessionId, damageFee);
  }
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
