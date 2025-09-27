// apps/shop-bcd/src/app/api/return/route.ts
import "@acme/zod-utils/initZod";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import { setReturnTracking } from "@platform-core/orders";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import shop from "../../../../shop.json";

export const runtime = "nodejs";

const ReturnSchema = z.object({ sessionId: z.string() }).strict();

async function createUpsLabel(sessionId: string) {
  const trackingNumber = `1Z${Math.random().toString().slice(2, 12)}`;
  const labelUrl = `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
  try {
    await fetch(
      `https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=${trackingNumber}`,
    );
  } catch {
    // ignore UPS API errors
  }
  await setReturnTracking(shop.id, sessionId, trackingNumber, labelUrl);
  return { trackingNumber, labelUrl };
}

async function getUpsStatus(tracking: string) {
  try {
    const res = await fetch(
      `https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=${tracking}`,
    );
    const data = await res.json();
    return data?.trackDetails?.[0]?.packageStatus?.statusType ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody<z.infer<typeof ReturnSchema>>(req, ReturnSchema, "1mb");
  if (parsed.success === false) {
    return parsed.response;
  }
  const { sessionId } = parsed.data;
  const cfg = await getReturnLogistics();
  const svc = (shop.returnService ?? {}) as {
    upsEnabled?: boolean;
    bagEnabled?: boolean;
    homePickupEnabled?: boolean;
  };
  if (!(cfg.labelService === "ups" && svc.upsEnabled && cfg.returnCarrier.includes("ups"))) {
    return NextResponse.json(
      { ok: false, error: "unsupported carrier" }, // i18n-exempt: machine-readable API error
      { status: 400 },
    );
  }
  const { trackingNumber, labelUrl } = await createUpsLabel(sessionId);
  return NextResponse.json({
    ok: true,
    dropOffProvider: cfg.dropOffProvider ?? null,
    returnCarrier: cfg.returnCarrier,
    tracking: { number: trackingNumber, labelUrl },
    bagType: svc.bagEnabled ? cfg.bagType : null,
    homePickupZipCodes: svc.homePickupEnabled ? cfg.homePickupZipCodes : [],
  });
}

export async function GET(req: NextRequest) {
  const tracking = req.nextUrl.searchParams.get("tracking");
  if (!tracking) {
    return NextResponse.json({ ok: false, error: "missing tracking" }, { status: 400 }); // i18n-exempt: machine-readable API error
  }
  const cfg = await getReturnLogistics();
  const svc = (shop.returnService ?? {}) as {
    upsEnabled?: boolean;
    bagEnabled?: boolean;
    homePickupEnabled?: boolean;
  };
  if (!(cfg.labelService === "ups" && svc.upsEnabled && cfg.returnCarrier.includes("ups"))) {
    return NextResponse.json(
      { ok: false, error: "unsupported carrier" }, // i18n-exempt: machine-readable API error
      { status: 400 },
    );
  }
  const status = await getUpsStatus(tracking);
  return NextResponse.json({ ok: true, status });
}
