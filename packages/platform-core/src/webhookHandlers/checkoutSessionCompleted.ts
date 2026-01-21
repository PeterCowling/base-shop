import type Stripe from "stripe";

import { stripe } from "@acme/stripe";

import { commitInventoryHold } from "../inventoryHolds";
import { addOrder } from "../orders/creation";
import { updateRisk } from "../orders/risk";
import { getShopSettings } from "../repositories/settings.server";

export default async function checkoutSessionCompleted(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  // display_items is a legacy Checkout field, so keep a local type until migrated.
  type LegacyDisplayItem = {
    custom?: { name?: string | null } | null;
    quantity?: number | null;
  };
  const displayItems = (
    session as Stripe.Checkout.Session & { display_items?: LegacyDisplayItem[] }
  ).display_items;
  const deposit = Number(session.metadata?.depositTotal ?? 0);
  const expectedReturnDate = session.metadata?.returnDate || undefined;
  const customerId = session.metadata?.internal_customer_id || undefined;
  const orderId = session.metadata?.order_id || undefined;
  const cartId = session.metadata?.cart_id || undefined;
  const inventoryHoldId =
    typeof session.metadata?.inventory_reservation_id === "string"
      ? session.metadata.inventory_reservation_id.trim()
      : undefined;

  const currency =
    typeof session.currency === "string" ? session.currency.toUpperCase() : undefined;
  const subtotalAmount =
    typeof session.amount_subtotal === "number" ? session.amount_subtotal : undefined;
  const totalAmount =
    typeof session.amount_total === "number" ? session.amount_total : undefined;
  const taxAmount =
    typeof session.total_details?.amount_tax === "number"
      ? session.total_details.amount_tax
      : undefined;
  const shippingAmount =
    typeof session.total_details?.amount_shipping === "number"
      ? session.total_details.amount_shipping
      : undefined;
  const discountAmount =
    typeof session.total_details?.amount_discount === "number"
      ? session.total_details.amount_discount
      : undefined;

  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.metadata?.stripe_customer_id || undefined;

  const lineItems = Array.isArray(displayItems)
    ? displayItems.flatMap((item: LegacyDisplayItem) => {
        const sku =
          typeof item.custom?.name === "string" ? item.custom.name : undefined;
        if (!sku) return [];
        const qty = typeof item.quantity === "number" ? item.quantity : 1;
        return [
          {
            sku,
            variantAttributes: {},
            quantity: qty,
          },
        ];
      })
    : undefined;

  await addOrder({
    orderId,
    shop,
    sessionId: session.id,
    deposit,
    expectedReturnDate,
    customerId,
    currency,
    subtotalAmount,
    taxAmount,
    shippingAmount,
    discountAmount,
    totalAmount,
    cartId,
    stripePaymentIntentId: piId,
    stripeCustomerId,
    ...(lineItems ? { lineItems } : {}),
  });

  // Commit inventory hold to finalize the stock decrement
  if (inventoryHoldId) {
    await commitInventoryHold({ shopId: shop, holdId: inventoryHoldId });
  }

  const settings = await getShopSettings(shop);
  const threshold = settings.luxuryFeatures.fraudReviewThreshold;
  const requireSCA = settings.luxuryFeatures.requireStrongCustomerAuth;
  if (deposit > threshold) {
    if (piId) {
      const reviews = stripe.reviews as unknown as {
        create: (params: { payment_intent: string }) => Promise<unknown>;
      };
      await reviews.create({ payment_intent: piId });
      if (requireSCA) {
        await stripe.paymentIntents.update(piId, {
          payment_method_options: { card: { request_three_d_secure: "any" } },
        });
      }
    }
    await updateRisk(shop, session.id, undefined, undefined, true);
  }
}
