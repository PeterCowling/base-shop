import type Stripe from "stripe";

import { validateShopName } from "./shops";
import { extractStripeObjectCandidates } from "./stripeObjectReferences";
import { findShopIdForStripeObject } from "./stripeObjectShopMapStore";

function readMetadataShopId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;
  const raw =
    (typeof record.shop_id === "string" ? record.shop_id : undefined) ??
    (typeof record.shopId === "string" ? record.shopId : undefined) ??
    (typeof record.shop === "string" ? record.shop : undefined);
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    return validateShopName(trimmed);
  } catch {
    return null;
  }
}

export async function resolveShopIdFromStripeEvent(
  event: Stripe.Event,
  options: { environment?: string } = {},
): Promise<string | null> {
  const dataObject = (event.data as unknown as { object?: unknown } | undefined)?.object;
  if (!dataObject || typeof dataObject !== "object") return null;
  const metadata = (dataObject as { metadata?: unknown }).metadata;
  const metaShopId = readMetadataShopId(metadata);
  if (metaShopId) return metaShopId;

  const candidates = extractStripeObjectCandidates(event);
  for (const candidate of candidates) {
    const shopId = await findShopIdForStripeObject({
      environment: options.environment,
      objectType: candidate.objectType,
      stripeId: candidate.stripeId,
    });
    if (shopId) return shopId;
  }

  return null;
}
