// packages/template-app/src/api/billing/webhook/route.ts
import { stripe } from "@acme/stripe";
import { paymentEnv } from "@acme/config/env/payments";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { setStripeSubscriptionId } from "@platform-core/repositories/users";
import { readShop } from "@platform-core/repositories/shops.server";

const SHOP_ID = "bcd";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const shop = await readShop(SHOP_ID);
  if (shop.billingProvider !== "stripe") {
    return NextResponse.json({ error: "Billing not enabled" }, { status: 400 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      paymentEnv.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await setStripeSubscriptionId(userId, null);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await setStripeSubscriptionId(userId, sub.id);
      }
      break;
    }
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
