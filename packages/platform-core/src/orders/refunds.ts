import "server-only";

import type { Prisma } from "@prisma/client";

import { nowIso } from "@acme/date-utils";
import { stripe } from "@acme/stripe";

import { prisma } from "../db";

import type { Order } from "./utils";
import { normalize } from "./utils";

export async function markRefunded(
  shop: string,
  sessionId: string,
  riskLevel?: string,
  riskScore?: number,
  flaggedForReview?: boolean,
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: {
        refundedAt: nowIso(),
        ...(riskLevel ? { riskLevel } : {}),
        ...(typeof riskScore === "number" ? { riskScore } : {}),
        ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
      },
    });
    if (!order) return null;
    return normalize(order as Order);
  } catch {
    return null;
  }
}

export async function refundOrder(
  shop: string,
  sessionId: string,
  amount?: number,
): Promise<Order | null> {
  const order = await prisma.rentalOrder.findUnique({
    where: { shop_sessionId: { shop, sessionId } },
  });
  if (!order) return null;

  const alreadyRefunded =
    (order as { refundTotal?: number }).refundTotal ?? 0;
  const total =
    (order as { total?: number }).total ??
    (order as { deposit?: number }).deposit ??
    (typeof amount === "number" ? amount : 0);
  const remaining = Math.max(total - alreadyRefunded, 0);
  const requested = typeof amount === "number" ? amount : remaining;
  const refundable = Math.min(requested, remaining);

  if (refundable > 0) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    const pi =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!pi) {
      throw new Error("payment_intent missing"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
    }
    await stripe.refunds.create({
      payment_intent: pi,
      amount: Math.round(refundable * 100),
    });
  }

  try {
    const updated = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: {
        refundedAt: nowIso(),
        refundTotal: alreadyRefunded + refundable,
      } as Prisma.RentalOrderUpdateInput,
    });
    if (!updated) return null;
    return normalize(updated as Order);
  } catch {
    return null;
  }
}
