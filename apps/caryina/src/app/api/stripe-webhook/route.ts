import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { paymentsEnv } from "@acme/config/env/payments";
import {
  markStripeWebhookEventFailed,
  markStripeWebhookEventProcessed,
} from "@acme/platform-core/stripeWebhookEventStore";
import { stripe } from "@acme/stripe";

import {
  expireStripeSession,
  finalizeStripeSession,
} from "@/lib/payments/stripeCheckout.server";

export const runtime = "nodejs";

const SHOP = "caryina";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, paymentsEnv.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  let handlerError: unknown = undefined;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await finalizeStripeSession(session.id);
    } catch (err) {
      handlerError = err;
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await expireStripeSession(session.id);
    } catch (err) {
      handlerError = err;
    }
  }

  // TC-07: Persist webhook event to StripeWebhookEvent table for Payment Manager audit log.
  // Write errors must never block webhook response — Stripe retries on 5xx.
  try {
    if (handlerError !== undefined) {
      await markStripeWebhookEventFailed(SHOP, event, handlerError);
    } else {
      await markStripeWebhookEventProcessed(SHOP, event);
    }
  } catch {
    // Intentional: store write failure is non-fatal — log would go here in production.
  }

  // Re-throw handler errors after the store write attempt, but still return 200
  // so Stripe does not retry. Checkout session finalization failures are handled
  // by the reconciliation process.
  return NextResponse.json({ received: true });
}
