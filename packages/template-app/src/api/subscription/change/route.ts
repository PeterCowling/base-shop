import { stripe } from "@acme/stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface Body {
  subscriptionId?: string;
  priceId?: string;
  prorate?: boolean;
}

export async function POST(req: NextRequest) {
  const { subscriptionId, priceId, prorate = true } = (await req.json()) as Body;
  if (!subscriptionId || !priceId) {
    return NextResponse.json(
      { error: "Missing subscriptionId or priceId" },
      { status: 400 },
    );
  }

  await stripe.subscriptions.update(subscriptionId, {
    items: [{ price: priceId }],
    proration_behavior: prorate ? "create_prorations" : "none",
  });

  return NextResponse.json({ ok: true });
}
