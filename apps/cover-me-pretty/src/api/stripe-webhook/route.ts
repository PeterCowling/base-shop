// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
import { handleStripeWebhook } from "@acme/platform-core/stripe-webhook";
import { stripe } from "@acme/stripe";
import { paymentsEnv } from "@acme/config/env/payments";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
    return new NextResponse("Invalid signature", { status: 400 }); // i18n-exempt -- I18N-123 server API error string; not end-user facing [ttl=2025-06-30]
  }
  await handleStripeWebhook("cover-me-pretty", event);
  return NextResponse.json({ received: true });
}
