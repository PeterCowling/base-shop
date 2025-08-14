import { markReturned } from "@platform-core/repositories/rentalOrders.server";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import { setReturnTracking } from "@platform-core/orders";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

async function createUpsLabel(sessionId: string, _service: string) {
  const trackingNumber = `1Z${Math.random().toString().slice(2, 12)}`;
  const labelUrl = `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
  try {
    await fetch(
      `https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=${trackingNumber}`,
    );
  } catch {
    // ignore UPS API errors
  }
  await setReturnTracking("bcd", sessionId, trackingNumber, labelUrl);
  return { trackingNumber, labelUrl };
}

export async function POST(req: NextRequest) {
  const cfg = await getReturnLogistics();
  if (!cfg.mobileApp) {
    return NextResponse.json({ error: "Mobile returns disabled" }, { status: 403 });
  }
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  const order = await markReturned("bcd", sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  let trackingNumber: string | null = null;
  let labelUrl: string | null = null;
  if (cfg.returnCarrier.map((c) => c.toLowerCase()).includes("ups")) {
    const res = await createUpsLabel(sessionId, cfg.labelService);
    trackingNumber = res.trackingNumber;
    labelUrl = res.labelUrl;
  }
  return NextResponse.json({ ok: true, trackingNumber, labelUrl });
}

