// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
import "@acme/zod-utils/initZod";
import { stripe } from "@acme/stripe";
import { computeDamageFee } from "@platform-core/pricing";
import {
  markRefunded,
  markReturned,
  readOrders,
} from "@platform-core/repositories/rentalOrders.server";
import shop from "../../../shop.json";
import type { RentalOrder } from "@acme/types";

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

  let alreadyReturned = false;
  let initial: RentalOrder | null | undefined;
  if (typeof readOrders === "function") {
    const orders = await readOrders("cover-me-pretty");
    initial = orders.find((o) => o.sessionId === sessionId);
  } else {
    initial = await markReturned("cover-me-pretty", sessionId);
    alreadyReturned = true;
  }
  if (!initial) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 }); // i18n-exempt -- ABC-123 server API error message; not end-user facing [ttl=2025-06-30]
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  const deposit = Number(session.metadata?.depositTotal ?? initial.deposit ?? 0);
  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!deposit || !pi) {
    return NextResponse.json({ ok: false, message: "No deposit found" }); // i18n-exempt -- ABC-123 server API message; not end-user facing [ttl=2025-06-30]
  }

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
      const refunded = await markRefunded(
        "cover-me-pretty",
        sessionId,
        initial.riskLevel,
        initial.riskScore,
        initial.flaggedForReview,
      );
      if (refunded === null) {
        return NextResponse.json(
          { error: "Payment processing failed" }, // i18n-exempt -- ABC-123 server API error message; not end-user facing [ttl=2025-06-30]
          { status: 500 },
        );
      }
    }
    if (!alreadyReturned) {
      await markReturned("cover-me-pretty", sessionId);
    }
    if (damageFee > 0) {
      await markReturned("cover-me-pretty", sessionId, damageFee);
    }
  } catch (err) {
    console.error("Failed to process refund", err); // i18n-exempt -- ABC-123 server log for debugging [ttl=2025-06-30]
    return NextResponse.json(
      { error: "Payment processing failed" }, // i18n-exempt -- ABC-123 server API error message; not end-user facing [ttl=2025-06-30]
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
