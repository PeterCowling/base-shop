// apps/shop-bcd/src/app/api/stripe-webhook/route.ts

import { addOrder, markRefunded } from "@platform-core/orders";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";

type WebhookData =
  | Stripe.Checkout.Session
  | Stripe.Charge
  | Record<string, unknown>;

const StripeEventSchema = z.object({
  type: z.string(),
  data: z.object({ object: z.unknown() }),
});

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const result = StripeEventSchema.safeParse(await req.json());
  if (!result.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { type: eventType, data } = result.data;
  const webhookData = data.object as WebhookData;

  switch (eventType) {
    case "checkout.session.completed": {
      const session = webhookData as Stripe.Checkout.Session;
      const deposit = Number(session.metadata?.depositTotal ?? 0);
      const returnDate = session.metadata?.returnDate || undefined;
      const customerId = session.metadata?.customerId || undefined;
      await addOrder("bcd", session.id, deposit, returnDate, customerId);
      break;
    }
    case "charge.refunded": {
      const charge = webhookData as Stripe.Charge;
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
