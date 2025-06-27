// apps/shop-abc/src/app/api/stripe-webhook/route.ts

import {
  addOrder,
  markRefunded,
} from "@platform-core/repositories/rentalOrders";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

type WebhookData =
  | Stripe.Checkout.Session
  | Stripe.Charge
  | Record<string, unknown>;

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as Stripe.Event;
  const eventType = payload.type;
  const data = payload.data?.object as WebhookData;

  switch (eventType) {
    case "checkout.session.completed": {
      const session = data as Stripe.Checkout.Session;
      const deposit = Number(session.metadata?.depositTotal ?? 0);
      const returnDate = session.metadata?.returnDate || undefined;
      await addOrder("abc", session.id, deposit, returnDate);
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
      await markRefunded("abc", sid);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
