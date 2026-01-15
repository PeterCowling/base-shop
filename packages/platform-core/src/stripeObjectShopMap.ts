import "server-only";

import type Stripe from "stripe";
import { prisma } from "./db";
import { validateShopId } from "./shopContext";

export type StripeObjectType =
  | "checkout.session"
  | "payment_intent"
  | "charge"
  | "invoice"
  | "subscription";

export type StripeObjectCandidate = {
  objectType: StripeObjectType;
  stripeId: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeStripeObjectType(raw: unknown): StripeObjectType | null {
  if (!isNonEmptyString(raw)) return null;
  switch (raw) {
    case "checkout.session":
    case "payment_intent":
    case "charge":
    case "invoice":
    case "subscription":
      return raw;
    default:
      return null;
  }
}

function getStripeId(value: unknown): string | null {
  if (isNonEmptyString(value)) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    isNonEmptyString((value as { id?: unknown }).id)
  ) {
    return (value as { id: string }).id;
  }
  return null;
}

function pushCandidate(
  out: StripeObjectCandidate[],
  seen: Set<string>,
  candidate: StripeObjectCandidate,
): void {
  const key = `${candidate.objectType}:${candidate.stripeId}`;
  if (seen.has(key)) return;
  seen.add(key);
  out.push(candidate);
}

export function extractStripeObjectCandidatesFromEvent(
  event: Stripe.Event,
): StripeObjectCandidate[] {
  const out: StripeObjectCandidate[] = [];
  const seen = new Set<string>();

  const obj = (event.data as { object?: unknown } | undefined)?.object as
    | { object?: unknown; id?: unknown }
    | undefined;

  const objType = normalizeStripeObjectType(obj?.object);
  const objId = getStripeId(obj?.id);
  if (objType && objId) {
    pushCandidate(out, seen, { objectType: objType, stripeId: objId });
  }

  const paymentIntentId = getStripeId(
    (obj as { payment_intent?: unknown } | undefined)?.payment_intent,
  );
  if (paymentIntentId) {
    pushCandidate(out, seen, { objectType: "payment_intent", stripeId: paymentIntentId });
  }

  const latestChargeId = getStripeId(
    (obj as { latest_charge?: unknown } | undefined)?.latest_charge,
  );
  if (latestChargeId) {
    pushCandidate(out, seen, { objectType: "charge", stripeId: latestChargeId });
  }

  const chargeId = getStripeId((obj as { charge?: unknown } | undefined)?.charge);
  if (chargeId) {
    pushCandidate(out, seen, { objectType: "charge", stripeId: chargeId });
  }

  const invoiceId = getStripeId((obj as { invoice?: unknown } | undefined)?.invoice);
  if (invoiceId) {
    pushCandidate(out, seen, { objectType: "invoice", stripeId: invoiceId });
  }

  const subscriptionId = getStripeId(
    (obj as { subscription?: unknown } | undefined)?.subscription,
  );
  if (subscriptionId) {
    pushCandidate(out, seen, { objectType: "subscription", stripeId: subscriptionId });
  }

  return out;
}

export async function upsertStripeObjectShopMap(params: {
  livemode: boolean;
  objectType: StripeObjectType;
  stripeId: string;
  shopId: string;
}): Promise<void> {
  const shopId = validateShopId(params.shopId);
  const stripeId = params.stripeId.trim();
  if (!stripeId) return;

  const record = (await prisma.stripeObjectShopMap.upsert({
    where: {
      livemode_objectType_stripeId: {
        livemode: params.livemode,
        objectType: params.objectType,
        stripeId,
      },
    },
    create: {
      livemode: params.livemode,
      objectType: params.objectType,
      stripeId,
      shopId,
    },
    // Never overwrite an existing mapping automatically; conflicts must be resolved explicitly.
    update: {},
  })) as { shopId?: unknown };

  if (typeof record.shopId === "string" && record.shopId && record.shopId !== shopId) {
    throw new Error(
      `Stripe object is already mapped to a different shop (${record.shopId})`,
    ); // i18n-exempt -- internal validation error, not user-facing UI copy
  }
}

/**
 * Force an update of the Stripe object → shop mapping.
 * Intended for internal repair tooling only.
 */
export async function forceUpsertStripeObjectShopMap(params: {
  livemode: boolean;
  objectType: StripeObjectType;
  stripeId: string;
  shopId: string;
}): Promise<void> {
  const shopId = validateShopId(params.shopId);
  const stripeId = params.stripeId.trim();
  if (!stripeId) return;

  await prisma.stripeObjectShopMap.upsert({
    where: {
      livemode_objectType_stripeId: {
        livemode: params.livemode,
        objectType: params.objectType,
        stripeId,
      },
    },
    create: {
      livemode: params.livemode,
      objectType: params.objectType,
      stripeId,
      shopId,
    },
    update: { shopId },
  });
}

export async function resolveShopIdFromStripeObjectShopMap(params: {
  livemode: boolean;
  candidates: StripeObjectCandidate[];
}): Promise<string | null> {
  if (!params.candidates.length) return null;
  const rows = (await prisma.stripeObjectShopMap.findMany({
    where: {
      livemode: params.livemode,
      OR: params.candidates.map((c) => ({
        objectType: c.objectType,
        stripeId: c.stripeId,
      })),
    },
    select: { objectType: true, stripeId: true, shopId: true },
  })) as Array<{ objectType?: unknown; stripeId?: unknown; shopId?: unknown }>;

  const byKey = new Map<string, string>();
  for (const row of rows) {
    if (!isNonEmptyString(row.objectType)) continue;
    if (!isNonEmptyString(row.stripeId)) continue;
    if (!isNonEmptyString(row.shopId)) continue;
    try {
      byKey.set(`${row.objectType}:${row.stripeId}`, validateShopId(row.shopId));
    } catch {
      // ignore invalid rows; treat as unresolved
    }
  }

  for (const candidate of params.candidates) {
    const shopId = byKey.get(`${candidate.objectType}:${candidate.stripeId}`);
    if (shopId) return shopId;
  }

  return null;
}

export async function recordStripeObjectShopMappingsFromEvent(params: {
  shopId: string;
  event: Stripe.Event;
}): Promise<void> {
  const shopId = validateShopId(params.shopId);
  const livemode = params.event.livemode === true;
  const candidates = extractStripeObjectCandidatesFromEvent(params.event);
  if (!candidates.length) return;

  await Promise.all(
    candidates.map((candidate) =>
      upsertStripeObjectShopMap({
        livemode,
        objectType: candidate.objectType,
        stripeId: candidate.stripeId,
        shopId,
      }),
    ),
  );
}
