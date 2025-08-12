// apps/shop-bcd/src/api/stripe-webhook/route.ts

import { handleStripeWebhook } from "@platform-core/stripe-webhook";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const event = (await req.json()) as Stripe.Event;
  await handleStripeWebhook("bcd", event);
  return NextResponse.json({ received: true });
}
