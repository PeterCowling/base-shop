import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { trackEvent } from "@acme/platform-core/analytics";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";

import shop from "../../../../../shop.json";

export const runtime = "nodejs";

const ALLOWED_EVENT_TYPES = new Set([
  "page_view",
  "product_view",
  "add_to_cart",
  "checkout_started",
  "order_completed",
  "notify_me_submit",
]);

type AnalyticsPayload = {
  type?: string;
  [key: string]: unknown;
};

export async function POST(req: NextRequest) {
  const consentGiven = req.cookies.get("consent.analytics")?.value === "true";
  if (!consentGiven) {
    return NextResponse.json({ ok: true, skipped: "no-consent" }, { status: 202 });
  }

  const payload = (await req.json().catch(() => ({}))) as AnalyticsPayload;
  if (!payload.type || !ALLOWED_EVENT_TYPES.has(payload.type)) {
    return NextResponse.json({ error: "Invalid analytics payload" }, { status: 400 });
  }

  try {
    const settings = await getShopSettings(shop.id);
    if (settings.analytics?.enabled === false) {
      return NextResponse.json(
        { ok: true, skipped: "analytics-disabled" },
        { status: 202 },
      );
    }
  } catch {
    // default allow - this endpoint is best effort
  }

  await trackEvent(shop.id, payload as { type: string; [key: string]: unknown });
  return NextResponse.json({ ok: true });
}
