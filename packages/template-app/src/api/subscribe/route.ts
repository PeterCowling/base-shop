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
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 }); // i18n-exempt: machine-readable API error
  }

  const shop = await readShop(SHOP_ID);
  if (!shop.subscriptionsEnabled) {
    return NextResponse.json(
      { error: "Subscriptions disabled" }, // i18n-exempt: machine-readable API error
      { status: 403 }
    );
  }
  if (shop.billingProvider !== "stripe") {
    return NextResponse.json({ error: "Billing not enabled" }, { status: 400 }); // i18n-exempt: machine-readable API error
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 }); // i18n-exempt: machine-readable API error
  }

  try {
    if (user.stripeSubscriptionId) {
      const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [{ price: priceId }],
        // Ensure prorations are created when updating the subscription
        proration_behavior: "create_prorations",
      });
      await setStripeSubscriptionId(userId, sub.id, SHOP_ID);
      return NextResponse.json({ id: sub.id, status: sub.status });
    }
    const sub = await stripe.subscriptions.create({
      customer: userId,
      items: [{ price: priceId }],
      // Ensure prorations are created when starting the subscription
      proration_behavior: "create_prorations",
      metadata: { userId, shop: SHOP_ID },
    });
    await setStripeSubscriptionId(userId, sub.id, SHOP_ID);
    return NextResponse.json({ id: sub.id, status: sub.status });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("An unknown error occurred"); // i18n-exempt: developer log, not user-facing
    return NextResponse.json({ error: "Unknown error" }, { status: 500 }); // i18n-exempt: machine-readable API error
  }
}
