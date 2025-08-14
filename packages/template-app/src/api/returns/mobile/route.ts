import { markReturned } from "@platform-core/repositories/rentalOrders.server";
import {
  getReturnLogistics,
  getReturnBagAndLabel,
} from "@platform-core/returnLogistics";
import { setReturnTracking } from "@platform-core/orders";
import { NextRequest, NextResponse } from "next/server";
import { readShop } from "@platform-core/repositories/shops.server";
import { getShopSettings } from "@platform-core/repositories/settings.server";

const SHOP_ID = "bcd";

export const runtime = "edge";

async function createUpsLabel(sessionId: string) {
  const trackingNumber = `1Z${Math.random().toString().slice(2, 12)}`;
  const labelUrl = `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
  try {
    await fetch(
      `https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=${trackingNumber}`
    );
  } catch {
    /* ignore UPS API errors */
  }
  await setReturnTracking(SHOP_ID, sessionId, trackingNumber, labelUrl);
  return { trackingNumber, labelUrl };
}

export async function POST(req: NextRequest) {
  const shop = await readShop(SHOP_ID);
  if (!shop.returnsEnabled) {
    return NextResponse.json(
      { error: "Returns disabled" },
      { status: 403 },
    );
  }
  const cfg = await getReturnLogistics();
  if (!cfg.mobileApp) {
    return NextResponse.json(
      { error: "Mobile returns disabled" },
      { status: 403 }
    );
  }
  const settings = await getShopSettings(SHOP_ID);
  if (!settings.returnService?.bagAndLabelEnabled) {
    return NextResponse.json(
      { error: "Return labels disabled" },
      { status: 403 },
    );
  }
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }
  const order = await markReturned(SHOP_ID, sessionId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  let labelUrl: string | null = null;
  let tracking: string | null = null;
  const bag = await getReturnBagAndLabel();
  if (bag.returnCarrier.map((c) => c.toLowerCase()).includes("ups")) {
    const label = await createUpsLabel(sessionId);
    labelUrl = label.labelUrl;
    tracking = label.trackingNumber;
  }
  return NextResponse.json({ ok: true, labelUrl, tracking });
}
