// packages/template-app/src/api/stripe-webhook/route.ts

import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { paymentsEnv } from "@acme/config/env/payments";
import { handleStripeWebhook } from "@acme/platform-core/stripe-webhook";
import { stripe } from "@acme/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      paymentsEnv.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return new NextResponse("Invalid signature", { status: 400 }); // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
  }
  await handleStripeWebhook("bcd", event);
  return NextResponse.json({ received: true });
}
