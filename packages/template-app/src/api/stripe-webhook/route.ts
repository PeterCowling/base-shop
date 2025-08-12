// packages/template-app/src/api/stripe-webhook/route.ts

import {
  addOrder,
  markRefunded,
} from "@platform-core/repositories/rentalOrders.server";
import { stripe } from "@acme/stripe";
import { paymentEnv } from "@acme/config/env/payments";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

type WebhookData =
  | Stripe.Checkout.Session
  | Stripe.Charge
  | Record<string, unknown>;

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      paymentEnv.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = event.type;
  const data = event.data.object as WebhookData;

  switch (eventType) {
    case "checkout.session.completed": {
      const session = data as Stripe.Checkout.Session;
      const deposit = Number(session.metadata?.depositTotal ?? 0);
      const returnDate = session.metadata?.returnDate || undefined;
      await addOrder("bcd", session.id, deposit, returnDate);
      break;
    }
    case "charge.refunded": {
      const charge = data as Stripe.Charge;
      const sessionId = (() => {
        if (
          typeof charge.payment_intent !== "string" &&
          charge.payment_intent
        ) {
          const pi = charge.payment_intent as Stripe.PaymentIntent & {
            charges?: { data?: Array<{ invoice?: string | null }> };
          };
          return pi.charges?.data?.[0]?.invoice || undefined;
        }
        return undefined;
      })();
      const sid = sessionId || charge.id;
      await markRefunded("bcd", sid);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
