// apps/shop-bcd/src/app/api/return/route.ts
import "@acme/lib/initZod";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import shop from "../../../../shop.json";
import { setTrackingNumber } from "@platform-core/orders";

export const runtime = "edge";

const ReturnSchema = z.object({ sessionId: z.string() }).strict();

async function createUpsLabel(sessionId: string) {
  try {
    const res = await fetch("https://onlinetools.ups.com/ship/v1/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: sessionId }),
    });
    const data = await res.json();
    const trackingNumber =
      data?.shipmentResults?.shipmentIdentificationNumber ||
      `1Z${Math.random().toString().slice(2, 12)}`;
    const labelUrl =
      data?.shipmentResults?.packageResults?.[0]?.labelUrl ||
      `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
    return { trackingNumber, labelUrl };
  } catch {
    const trackingNumber = `1Z${Math.random().toString().slice(2, 12)}`;
    const labelUrl = `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
    return { trackingNumber, labelUrl };
  }
}

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, ReturnSchema, "1mb");
  if (!parsed.success) return parsed.response;
  const { sessionId } = parsed.data;
  const { trackingNumber, labelUrl } = await createUpsLabel(sessionId);
  await setTrackingNumber(shop.id, sessionId, trackingNumber);
  return NextResponse.json({ ok: true, trackingNumber, labelUrl });
}
