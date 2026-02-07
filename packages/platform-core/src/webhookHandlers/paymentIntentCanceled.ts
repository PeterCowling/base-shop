import type Stripe from "stripe";

import { releaseInventoryHold } from "../inventoryHolds";

export default async function paymentIntentCanceled(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const pi = event.data.object as Stripe.PaymentIntent;
  const holdId =
    typeof pi.metadata?.inventory_reservation_id === "string"
      ? pi.metadata.inventory_reservation_id
      : undefined;
  if (!holdId || !holdId.trim()) return;
  await releaseInventoryHold({ shopId: shop, holdId: holdId.trim() });
}

