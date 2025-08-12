// apps/shop-bcd/src/api/stripe-webhook/route.ts

import { handleStripeWebhook } from "@platform-core/stripe-webhook";
import { stripe } from "@acme/stripe";
import { paymentEnv } from "@acme/config/env/payments";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      paymentEnv.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }
  await handleStripeWebhook("bcd", event);
  return NextResponse.json({ received: true });
}
