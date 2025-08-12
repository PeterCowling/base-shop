// apps/shop-bcd/src/api/stripe-webhook/route.ts
import { handleStripeWebhook } from "@platform-core/stripe-webhook";
import { NextResponse } from "next/server";
export const runtime = "edge";
export async function POST(req) {
    const event = await req.json();
    await handleStripeWebhook("bcd", event);
    return NextResponse.json({ received: true });
}
