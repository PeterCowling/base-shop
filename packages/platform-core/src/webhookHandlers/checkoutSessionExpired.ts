import type Stripe from "stripe";
import { releaseInventoryHold } from "../inventoryHolds";

export default async function checkoutSessionExpired(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const holdId =
    typeof session.metadata?.inventory_reservation_id === "string"
      ? session.metadata.inventory_reservation_id
      : undefined;
  if (holdId && holdId.trim()) {
    await releaseInventoryHold({ shopId: shop, holdId: holdId.trim() });
  }
}

