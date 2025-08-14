// packages/template-app/src/api/subscribe/route.ts
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
  const { userId, priceId } = (await req.json()) as {
    userId?: string;
    priceId?: string;
  };
  if (!userId || !priceId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const shop = await readShop(SHOP_ID);
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
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    if (user.stripeSubscriptionId) {
      const sub = await stripe.subscriptions.update(
        user.stripeSubscriptionId,
        {
          items: [{ price: priceId }],
          // `prorate` is deprecated but required for this flow
          prorate: true,
        },
      );
      await setStripeSubscriptionId(userId, sub.id, SHOP_ID);
      return NextResponse.json({ id: sub.id, status: sub.status });
    }
    const sub = await stripe.subscriptions.create({
      customer: userId,
      items: [{ price: priceId }],
      // `prorate` is deprecated but required for this flow
      prorate: true,
      metadata: { userId, shop: SHOP_ID },
    });
    await setStripeSubscriptionId(userId, sub.id, SHOP_ID);
    return NextResponse.json({ id: sub.id, status: sub.status });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("An unknown error occurred");
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
