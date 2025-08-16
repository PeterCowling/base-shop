// apps/shop-abc/src/app/api/return/route.ts
import "@acme/lib/initZod";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import {
  setReturnTracking,
  setReturnStatus,
} from "@platform-core/orders";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import {
  createUpsReturnLabel,
  getUpsStatus,
} from "@platform-core/shipping";
import shop from "../../../../shop.json";

export const runtime = "nodejs";

const ReturnSchema = z.object({ sessionId: z.string() }).strict();

export async function POST(req: NextRequest) {
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
    const { trackingNumber, labelUrl } = await createUpsReturnLabel(sessionId);
    await setReturnTracking(shop.id, sessionId, trackingNumber, labelUrl);
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
  const cfg = await getReturnLogistics();
  const svc = shop.returnService ?? {};
  if (
    cfg.labelService === "ups" &&
    svc.upsEnabled &&
    cfg.returnCarrier.includes("ups")
  ) {
    const status = await getUpsStatus(tracking);
    if (status) {
      await setReturnStatus(shop.id, tracking, status);
    }
    return NextResponse.json({ ok: true, status });
  }
  return NextResponse.json(
    { ok: false, error: "unsupported provider" },
    { status: 400 },
  );
}
