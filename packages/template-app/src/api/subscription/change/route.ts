// packages/template-app/src/api/subscription/change/route.ts
import { stripe } from "@acme/stripe";
import { NextRequest, NextResponse } from "next/server";
import { readShop } from "@platform-core/repositories/shops.server";
import {
  getUserById,
  setStripeSubscriptionId,
} from "@platform-core/repositories/users";

const SHOP_ID = "bcd";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { userId, priceId, planId } = (await req.json()) as {
    userId?: string;
    priceId?: string;
    planId?: string;
  };
  if (!userId || !priceId || !planId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const shop = await readShop(SHOP_ID);
  if (shop.billingProvider !== "stripe") {
    return NextResponse.json({ error: "Billing not enabled" }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user || !user.stripeSubscriptionId) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const plan = shop.rentalSubscriptions.find((p) => p.id === planId);
  const prorate = plan?.prorateOnChange !== false;

  try {
    const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [{ price: priceId }],
      proration_behavior: prorate ? "create_prorations" : "none",
    });
    await setStripeSubscriptionId(userId, sub.id);
    return NextResponse.json({ id: sub.id, status: sub.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
