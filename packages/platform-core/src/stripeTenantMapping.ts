import type Stripe from "stripe";
import { validateShopName } from "./shops";
import { extractStripeObjectCandidates } from "./stripeObjectReferences";
import { upsertStripeObjectShopMap } from "./stripeObjectShopMapStore";

export async function upsertStripeObjectShopMapsFromStripeEvent(params: {
  shopId: string;
  event: Stripe.Event;
  environment?: string;
}): Promise<void> {
  const shopId = validateShopName(params.shopId);
  const candidates = extractStripeObjectCandidates(params.event);
  if (candidates.length === 0) return;

  await Promise.all(
    candidates.map((candidate) =>
      upsertStripeObjectShopMap({
        environment: params.environment,
        objectType: candidate.objectType,
        stripeId: candidate.stripeId,
        shopId,
      }),
    ),
  );
}

