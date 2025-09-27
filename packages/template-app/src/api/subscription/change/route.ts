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
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 }); // i18n-exempt: API validation message for developers/clients
  }

    const shopId =
      req.nextUrl.searchParams.get("shop") ||
      (coreEnv.NEXT_PUBLIC_SHOP_ID as string | undefined) ||
      "shop";
  const shop = await readShop(shopId);
  if (!shop.subscriptionsEnabled) {
    return NextResponse.json(
      { error: "Subscriptions disabled" }, // i18n-exempt: API error; not rendered in UI
      { status: 403 },
    );
  }
  if (shop.billingProvider !== "stripe") {
    return NextResponse.json({ error: "Billing not enabled" }, { status: 400 }); // i18n-exempt: API error; not rendered in UI
  }

  const user = await getUserById(userId);
  if (!user || !user.stripeSubscriptionId) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 }); // i18n-exempt: API error; not rendered in UI
  }

  const plan = shop.rentalSubscriptions.find((p) => p.id === planId);
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 }); // i18n-exempt: API error; not rendered in UI
  }

  try {
    const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [{ price: priceId }],
      // @ts-expect-error - `prorate` is deprecated but required for this flow
      prorate: true,
    });
    await setStripeSubscriptionId(userId, sub.id, shopId);
    return NextResponse.json({ id: sub.id, status: sub.status });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 }); // i18n-exempt: surfaced from Stripe/infra; not user copy
    }
    console.error("An unknown error occurred"); // i18n-exempt: operational log
    return NextResponse.json({ error: "Unknown error" }, { status: 500 }); // i18n-exempt: API fallback; not user copy
  }
}
