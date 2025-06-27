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
      const deposit = Number(data.metadata?.depositTotal ?? 0);
      const returnDate = data.metadata?.returnDate || undefined;
      await addOrder("bcd", data.id, deposit, returnDate);
      break;
    }
    case "charge.refunded": {
      const sessionId = data.payment_intent?.charges?.data?.[0]?.invoice;
      const sid = sessionId || data.id;
      await markRefunded("bcd", sid);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
