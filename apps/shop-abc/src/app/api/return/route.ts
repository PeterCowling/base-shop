// apps/shop-abc/src/app/api/return/route.ts
import "@acme/lib/initZod";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import {
  setReturnTracking,
  getOrderByTracking,
} from "@platform-core/orders";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import {
  createReturnLabel,
  getTrackingStatus,
} from "@platform-core/shipping";
import { recordStatus } from "@platform-core/repositories/reverseLogisticsEvents.server";
import shop from "../../../../shop.json";

export const runtime = "nodejs";

const ReturnSchema = z.object({ sessionId: z.string() }).strict();

export async function POST(req: NextRequest) {
  if (!shop.luxuryFeatures?.returns) {
    return NextResponse.json(
      { ok: false, error: "returns disabled" },
      { status: 404 },
    );
  }
  const parsed = await parseJsonBody(req, ReturnSchema, "1mb");
  if (!parsed.success) return parsed.response;
  const { sessionId } = parsed.data;

  const cfg = await getReturnLogistics();
  const svc = shop.returnService ?? {};
  let tracking: { number: string; labelUrl: string } | null = null;

  if (
    cfg.labelService === "ups" &&
    svc.upsEnabled &&
    cfg.returnCarrier.includes("ups")
  ) {
    const { trackingNumber, labelUrl } = await createReturnLabel({
      provider: "ups",
    });
    await setReturnTracking(shop.id, sessionId, trackingNumber, labelUrl);
    await recordStatus(shop.id, sessionId, "label_created");
    tracking = { number: trackingNumber, labelUrl };
  }

  return NextResponse.json({
    ok: true,
    dropOffProvider: cfg.dropOffProvider ?? null,
    returnCarrier: cfg.returnCarrier,
    bagType: svc.bagEnabled ? cfg.bagType : null,
    homePickupZipCodes: svc.homePickupEnabled ? cfg.homePickupZipCodes : [],
    tracking,
  });
}

export async function GET(req: NextRequest) {
  const tracking = req.nextUrl.searchParams.get("tracking");
  if (!tracking) {
    return NextResponse.json({ ok: false, error: "missing tracking" }, { status: 400 });
  }
  if (!shop.luxuryFeatures?.returns) {
    return NextResponse.json({ ok: false, error: "returns disabled" }, { status: 404 });
  }
  const cfg = await getReturnLogistics();
  const svc = shop.returnService ?? {};
  if (
    cfg.labelService === "ups" &&
    svc.upsEnabled &&
    cfg.returnCarrier.includes("ups")
  ) {
    const { status } = await getTrackingStatus({
      provider: "ups",
      trackingNumber: tracking,
    });
    const order = await getOrderByTracking(shop.id, tracking);
    if (order && status) {
      await recordStatus(shop.id, order.sessionId, status);
    }
    return NextResponse.json({ ok: true, status });
  }
  return NextResponse.json(
    { ok: false, error: "unsupported provider" },
    { status: 400 },
  );
}
