import { stripe } from "@acme/stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { subscriptionId, priceId, prorate } = (await req.json()) as {
    subscriptionId?: string;
    priceId?: string;
    prorate?: boolean;
  };
  if (!subscriptionId || !priceId) {
    return NextResponse.json(
      { error: "Missing subscriptionId or priceId" },
      { status: 400 },
    );
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = subscription.items.data[0]?.id;
  if (!itemId) {
    return NextResponse.json({ error: "No subscription item" }, { status: 400 });
  }

  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: prorate ? "create_prorations" : "none",
  });

  return NextResponse.json({ ok: true, subscription: updated });
}
