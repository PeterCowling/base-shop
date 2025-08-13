// apps/shop-abc/src/app/api/rental/route.ts
import "@acme/lib/initZod";

import { stripe } from "@acme/stripe";
import { requirePermission } from "@auth";
import {
  addOrder,
  markReturned,
} from "@platform-core/repositories/rentalOrders.server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

export const runtime = "edge";

const RentalSchema = z.object({ sessionId: z.string() }).strict();
const ReturnSchema = z
  .object({ sessionId: z.string(), damageFee: z.number().optional() })
  .strict();

export async function POST(req: NextRequest) {
  try {
    await requirePermission("manage_orders");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = await parseJsonBody(req, RentalSchema, "1mb");
  if (!parsed.success) return parsed.response;
  const { sessionId } = parsed.data;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const deposit = Number(session.metadata?.depositTotal ?? 0);
  const expected = session.metadata?.returnDate || undefined;
  await addOrder("abc", sessionId, deposit, expected);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  try {
    await requirePermission("manage_orders");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = await parseJsonBody(req, ReturnSchema, "1mb");
  if (!parsed.success) return parsed.response;
  const { sessionId, damageFee } = parsed.data;
  const order = await markReturned("abc", sessionId, damageFee);
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
