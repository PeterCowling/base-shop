// packages/template-app/src/api/subscription/cancel/route.ts
import { stripe } from "@acme/stripe";
import { coreEnv } from "@acme/config/env/core";
import { NextRequest, NextResponse } from "next/server";
import { readShop } from "@platform-core/repositories/shops.server";
import { getUserById, setStripeSubscriptionId } from "@platform-core/repositories/users";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { userId } = (await req.json()) as { userId?: string };
  if (!userId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const shopId =
    req.nextUrl.searchParams.get("shop") ||
    (coreEnv.NEXT_PUBLIC_SHOP_ID as string | undefined) ||
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
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 },
    );
  }

  try {
    // Align with Stripe API and test expectations: use `subscriptions.del`
    // to cancel/delete an active subscription.
    const sub = await stripe.subscriptions.del(user.stripeSubscriptionId);
    await setStripeSubscriptionId(userId, null, shopId);
    return NextResponse.json({ id: sub.id, status: sub.status });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("An unknown error occurred");
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
