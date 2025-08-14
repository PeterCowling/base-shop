// packages/template-app/src/api/subscription/change/route.ts
import { stripe } from "@acme/stripe";
import { coreEnv } from "@acme/config/env/core";
import { NextRequest, NextResponse } from "next/server";
import { readShop } from "@platform-core/repositories/shops.server";
import {
  getUserById,
  setStripeSubscriptionId,
} from "@platform-core/repositories/users";

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

  const shopId =
    req.nextUrl.searchParams.get("shop") ||
    coreEnv.NEXT_PUBLIC_SHOP_ID ||
    "shop";
  const shop = await readShop(shopId);
  if (!shop.subscriptionsEnabled) {
    return NextResponse.json(
      { error: "Subscriptions disabled" },
      { status: 403 },
    );
  }
  if (shop.billingProvider !== "stripe") {
    return NextResponse.json({ error: "Billing not enabled" }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user || !user.stripeSubscriptionId) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const plan = shop.rentalSubscriptions.find((p) => p.id === planId);
  const proration_behavior = plan?.prorateOnChange
    ? "create_prorations"
    : "none";

  try {
    const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [{ price: priceId }],
      proration_behavior,
    });
    await setStripeSubscriptionId(userId, sub.id);
    return NextResponse.json({ id: sub.id, status: sub.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
