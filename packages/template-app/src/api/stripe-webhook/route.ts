// packages/template-app/src/api/stripe-webhook/route.ts

import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { paymentsEnv } from "@acme/config/env/payments";
import { handleStripeWebhook } from "@acme/platform-core/stripe-webhook";
import { assertStripeWebhookTenant } from "@acme/platform-core/stripeTenantResolver";
import { recordMetric } from "@acme/platform-core/utils";
import { stripe } from "@acme/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      paymentsEnv.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return new NextResponse("Invalid signature", { status: 400 }); // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
  }

  const expectedShopId = "bcd";
  const tenant = await assertStripeWebhookTenant(event, expectedShopId);
  if (!tenant.ok) {
    if (tenant.reason === "mismatch") {
      recordMetric(
        "webhook_tenant_mismatch_total",
        { shopId: expectedShopId, service: "template-app" },
        1,
      );
      console.error("[stripe-webhook] tenant mismatch", {
        eventId: event.id,
        expectedShopId,
        resolvedShopId: tenant.resolvedShopId,
      });
      return NextResponse.json(
        { error: "Tenant mismatch" }, // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
        { status: tenant.status },
      );
    }

    recordMetric(
      "webhook_tenant_unresolvable_total",
      { shopId: expectedShopId, service: "template-app" },
      1,
    );
    console.error("[stripe-webhook] tenant unresolvable", {
      eventId: event.id,
      expectedShopId,
    });
    return NextResponse.json(
      { error: "Tenant unresolvable" }, // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
      { status: tenant.status },
    );
  }

  await handleStripeWebhook(expectedShopId, event);
  return NextResponse.json({ received: true });
}
