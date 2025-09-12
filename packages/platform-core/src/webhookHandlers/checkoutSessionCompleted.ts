import type Stripe from "stripe";
import { stripe } from "@acme/stripe";
import { addOrder } from "../orders/creation";
import { updateRisk } from "../orders/risk";
import { getShopSettings } from "../repositories/settings.server";

export default async function checkoutSessionCompleted(
  shop: string,
  event: Stripe.Event
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const deposit = Number(session.metadata?.depositTotal ?? 0);
  const returnDate = session.metadata?.returnDate || undefined;
  const customerId = session.metadata?.customerId || undefined;
  await addOrder(shop, session.id, deposit, returnDate, customerId);

  const settings = await getShopSettings(shop);
  const threshold = settings.luxuryFeatures.fraudReviewThreshold;
  const requireSCA = settings.luxuryFeatures.requireStrongCustomerAuth;
  if (deposit > threshold) {
    const piId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (piId) {
      const reviews = stripe.reviews as unknown as {
        create: (params: { payment_intent: string }) => Promise<unknown>;
      };
      await reviews.create({ payment_intent: piId });
      if (requireSCA) {
        await stripe.paymentIntents.update(piId, {
          payment_method_options: {
            card: { request_three_d_secure: "any" },
          },
        });
      }
    }
    await updateRisk(shop, session.id, undefined, undefined, true);
  }
}
