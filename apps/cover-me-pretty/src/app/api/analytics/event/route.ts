// apps/cover-me-pretty/src/app/api/analytics/event/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@acme/platform-core/analytics";
import { getShopSettings } from "@acme/platform-core/repositories/shops.server";

import shop from "../../../../../shop.json";

export const runtime = "nodejs";

const PageView = z.object({
  type: z.literal("page_view"),
  path: z.string().min(1),
  locale: z.string().optional(),
  clientId: z.string().optional(),
});

const ProductView = z.object({
  type: z.literal("product_view"),
  productId: z.string().min(1),
  path: z.string().optional(),
  clientId: z.string().optional(),
});

const AddToCart = z.object({
  type: z.literal("add_to_cart"),
  productId: z.string().min(1),
  size: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  source: z.string().optional(),
  clientId: z.string().optional(),
});

const CheckoutStarted = z.object({
  type: z.literal("checkout_started"),
  currency: z.string().optional(),
  value: z.number().nonnegative().optional(),
  clientId: z.string().optional(),
});

const OrderCompleted = z.object({
  type: z.literal("order_completed"),
  orderId: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  clientId: z.string().optional(),
});

const Search = z.object({
  type: z.literal("search"),
  query: z.string().min(1),
  results: z.number().int().nonnegative().optional(),
  clientId: z.string().optional(),
});

const FilterChange = z.object({
  type: z.literal("filter_change"),
  filters: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  clientId: z.string().optional(),
});

const Body = z.discriminatedUnion("type", [
  PageView,
  ProductView,
  AddToCart,
  CheckoutStarted,
  OrderCompleted,
  Search,
  FilterChange,
]);

export async function POST(req: NextRequest) {
  // Respect consent banner: skip if analytics consent not given.
  const consent = req.cookies.get("consent.analytics")?.value === "true";
  if (!consent) {
    return NextResponse.json({ ok: true, skipped: "no-consent" }, { status: 202 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid analytics payload" }, { status: 400 }); // i18n-exempt -- SHOP-3206 machine-readable API error [ttl=2026-06-30]
  }

  // Respect shop-level analytics toggle
  try {
    const settings = await getShopSettings(shop.id);
    if (settings.analytics?.enabled === false) {
      return NextResponse.json({ ok: true, skipped: "analytics-disabled" }, { status: 202 });
    }
  } catch {
    // default to allow; failures are tolerated
  }

  // Delegate to platform analytics; when analyticsEnabled is false this is a no-op.
  await trackEvent(shop.id, parsed.data);
  return NextResponse.json({ ok: true });
}
