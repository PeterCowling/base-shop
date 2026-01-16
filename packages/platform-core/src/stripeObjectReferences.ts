import type Stripe from "stripe";
import type { StripeObjectType } from "./stripeObjectShopMapStore";

export type StripeObjectCandidate = { objectType: StripeObjectType; stripeId: string };

function shopMapObjectTypeFromStripeId(stripeId: string): StripeObjectType | null {
  if (stripeId.startsWith("cs_")) return "checkout_session";
  if (stripeId.startsWith("pi_")) return "payment_intent";
  if (stripeId.startsWith("ch_")) return "charge";
  if (stripeId.startsWith("sub_")) return "subscription";
  if (stripeId.startsWith("in_")) return "invoice";
  return null;
}

function readStripeId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;
  const id = (value as { id?: unknown }).id;
  return typeof id === "string" ? id : null;
}

function pushCandidate(
  candidates: StripeObjectCandidate[],
  seen: Set<string>,
  stripeId: string | null,
): void {
  if (!stripeId) return;
  const trimmed = stripeId.trim();
  if (!trimmed) return;
  const objectType = shopMapObjectTypeFromStripeId(trimmed);
  if (!objectType) return;
  const key = `${objectType}:${trimmed}`;
  if (seen.has(key)) return;
  seen.add(key);
  candidates.push({ objectType, stripeId: trimmed });
}

export function extractStripeObjectCandidates(event: Stripe.Event): StripeObjectCandidate[] {
  const candidates: StripeObjectCandidate[] = [];
  const seen = new Set<string>();

  const dataObject = (event.data as unknown as { object?: unknown } | undefined)?.object;
  if (!dataObject || typeof dataObject !== "object") return candidates;
  const record = dataObject as Record<string, unknown>;

  // Prefer the primary object ID for this event type.
  const primaryId = readStripeId(record);
  pushCandidate(candidates, seen, primaryId);

  // Common Stripe references found across events.
  pushCandidate(candidates, seen, readStripeId(record.subscription));
  pushCandidate(candidates, seen, readStripeId(record.latest_invoice));
  pushCandidate(candidates, seen, readStripeId(record.invoice));
  pushCandidate(candidates, seen, readStripeId(record.payment_intent));
  pushCandidate(candidates, seen, readStripeId(record.latest_charge));
  pushCandidate(candidates, seen, readStripeId(record.charge));

  return candidates;
}

