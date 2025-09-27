import { handleStripeWebhook } from "@platform-core/stripe-webhook";
import { stripe } from "@acme/stripe";
import { paymentsEnv } from "@acme/config/env/payments";
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
      paymentsEnv.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new NextResponse("Invalid signature", { status: 400 }); // i18n-exempt: server API error string; not end-user facing
  }
  await handleStripeWebhook("bcd", event);
  return NextResponse.json({ received: true });
}
