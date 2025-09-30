// packages/template-app/src/api/subscription/cancel/route.ts
import { stripe } from "@acme/stripe";
import { coreEnv } from "@acme/config/env/core";
import { NextRequest, NextResponse } from "next/server";
import { readShop } from "@platform-core/repositories/shops.server";
import { getUserById, setStripeSubscriptionId } from "@platform-core/repositories/users";
import type Stripe from "stripe";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { userId } = (await req.json()) as { userId?: string };
  if (!userId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 }); // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
  }

  const shopId =
    req.nextUrl.searchParams.get("shop") ||
    (coreEnv.NEXT_PUBLIC_SHOP_ID as string | undefined) ||
    "shop";

  const shop = await readShop(shopId);
  if (!shop.subscriptionsEnabled) {
    return NextResponse.json(
      { error: "Subscriptions disabled" }, // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
      { status: 403 },
    );
  }
  if (shop.billingProvider !== "stripe") {
    return NextResponse.json({ error: "Billing not enabled" }, { status: 400 }); // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
  }

  const user = await getUserById(userId);
  if (!user || !user.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Subscription not found" }, // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
      { status: 404 },
    );
  }

  try {
    // Cancel/delete an active subscription via Stripe SDK
    // Note: older Stripe SDKs use `del`, not `cancel`.
    // Prefer the typed "cancel" API; fall back to legacy "del" without using any
    let sub: Stripe.Subscription;
    if ("cancel" in stripe.subscriptions && typeof stripe.subscriptions.cancel === "function") {
      sub = await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } else {
      const legacy = stripe.subscriptions as unknown as {
        del: (id: string) => Promise<Stripe.Subscription>;
      };
      sub = await legacy.del(user.stripeSubscriptionId);
    }
    await setStripeSubscriptionId(userId, null, shopId);
    return NextResponse.json({ id: sub.id, status: sub.status });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("An unknown error occurred"); // i18n-exempt -- ABC-123 [ttl=2025-12-31] developer log, not user-facing
    return NextResponse.json({ error: "Unknown error" }, { status: 500 }); // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
  }
}
