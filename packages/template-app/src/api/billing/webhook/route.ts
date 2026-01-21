// packages/template-app/src/api/billing/webhook/route.ts
import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { paymentsEnv } from "@acme/config/env/payments";
import { readShop } from "@acme/platform-core/repositories/shops.server";
import { setStripeSubscriptionId } from "@acme/platform-core/repositories/users";
import { stripe } from "@acme/stripe";

const SHOP_ID = "bcd";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const shop = await readShop(SHOP_ID);
  if (shop.billingProvider !== "stripe") {
    return NextResponse.json({ error: "Billing not enabled" }, { status: 400 }); // i18n-exempt -- ABC-123: machine-readable API error
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      paymentsEnv.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new NextResponse("Invalid signature", { status: 400 }); // i18n-exempt -- ABC-123: machine-readable API error
  }

  switch (event.type) {
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await setStripeSubscriptionId(userId, null, SHOP_ID);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await setStripeSubscriptionId(userId, sub.id, SHOP_ID);
      }
      break;
    }
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
