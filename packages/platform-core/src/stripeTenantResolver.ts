import "server-only";

import type Stripe from "stripe";

import { prisma } from "./db";
import {
  resolveShopIdFromStripeEvent as resolveShopIdFromStripeEventMetadata,
  validateShopId,
} from "./shopContext";
import {
  extractStripeObjectCandidatesFromEvent,
  resolveShopIdFromStripeObjectShopMap,
  type StripeObjectCandidate,
} from "./stripeObjectShopMap";

async function resolveShopIdFromRentalOrders(
  candidates: StripeObjectCandidate[],
): Promise<string | null> {
  for (const candidate of candidates) {
    const where =
      candidate.objectType === "checkout.session"
        ? { sessionId: candidate.stripeId }
        : candidate.objectType === "payment_intent"
          ? { stripePaymentIntentId: candidate.stripeId }
          : candidate.objectType === "charge"
            ? { stripeChargeId: candidate.stripeId }
            : null;

    if (!where) continue;

    const matches = (await prisma.rentalOrder.findMany({
      where,
      select: { shop: true },
    })) as Array<{ shop?: unknown }>;

    const shops = new Set<string>();
    for (const row of matches) {
      if (typeof row.shop !== "string") continue;
      try {
        shops.add(validateShopId(row.shop));
      } catch {
        // ignore invalid values
      }
    }

    if (shops.size === 1) {
      return Array.from(shops)[0] ?? null;
    }
  }

  return null;
}

/**
 * Resolve tenant identity for a Stripe webhook event.
 *
 * Resolution order:
 *  1) Stripe metadata (fast-path, conservative)
 *  2) StripeObjectShopMap lookup (canonical fallback)
 *  3) Existing internal records (best-effort, bounded)
 */
export async function resolveShopIdFromStripeEventWithFallback(
  event: Stripe.Event,
): Promise<string | null> {
  const direct = resolveShopIdFromStripeEventMetadata(event);
  if (direct) return direct;

  const livemode = event.livemode === true;
  const candidates = extractStripeObjectCandidatesFromEvent(event);

  const mapped = await resolveShopIdFromStripeObjectShopMap({ livemode, candidates });
  if (mapped) return mapped;

  return resolveShopIdFromRentalOrders(candidates);
}
