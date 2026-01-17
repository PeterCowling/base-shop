// TryOn analytics forwarder (Node runtime to use platform-core providers)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@acme/shared-utils";

export const runtime = "edge";

const base = z.object({
  productId: z.string(),
  idempotencyKey: z.string().uuid(),
});

const Started = base.extend({ type: z.literal("TryOnStarted"), mode: z.union([z.literal("accessory"), z.literal("garment")]) });
const PreviewShown = base.extend({ type: z.literal("TryOnPreviewShown"), mode: z.union([z.literal("accessory"), z.literal("garment")]), preprocessMs: z.number().optional() });
const Enhanced = base.extend({ type: z.literal("TryOnEnhanced"), generateMs: z.number().optional() });
const AddToCart = base.extend({
  type: z.literal("TryOnAddToCart"),
  transform: z.record(z.unknown()).optional(),
});
const ErrorEv = base.extend({ type: z.literal("TryOnError"), code: z.string().optional(), message: z.string().optional() });

const Body = z.discriminatedUnion("type", [Started, PreviewShown, Enhanced, AddToCart, ErrorEv]);

type TryOnAnalyticsEvent = z.infer<typeof Body> & {
  shop: string;
};

function shopId(): string {
  return process.env.NEXT_PUBLIC_SHOP_ID || "default";
}

async function sendToGA(event: TryOnAnalyticsEvent) {
  const measurementId = process.env.NEXT_PUBLIC_GA4_ID;
  const apiSecret = process.env.GA_API_SECRET;
  if (!measurementId || !apiSecret) return false;
  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
    const body = { client_id: event.idempotencyKey || 'tryon-ctx', events: [{ name: event.type, params: { ...event } }] };
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return true;
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, Body, "10kb");
  if ("response" in parsed) return parsed.response;
  const data = parsed.data;
  const shop = shopId();
  const ok = await sendToGA({ shop, ...data });
  if (!ok) {
    // Best-effort: keep edge-only; log minimal info
    try { console.log('tryon.analytics', { shop, type: data.type, productId: data.productId }); } catch {}
  }
  return NextResponse.json({ ok: true });
}
