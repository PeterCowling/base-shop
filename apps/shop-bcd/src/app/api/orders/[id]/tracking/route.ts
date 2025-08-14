// apps/shop-bcd/src/app/api/orders/[id]/tracking/route.ts
import { NextResponse } from "next/server";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import type { OrderStep } from "@ui/components/organisms/OrderTrackingTimeline";
import shop from "../../../../../../shop.json";

const providerEvents: Record<string, OrderStep[]> = {
  ups: [
    { label: "Shipment picked up", date: "2024-01-01", complete: true },
    { label: "Out for delivery", complete: false },
  ],
  dhl: [
    { label: "Processed at DHL facility", date: "2024-01-01", complete: true },
    { label: "In transit", complete: false },
  ],
};

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const settings = await getShopSettings(shop.id);
  const providers = settings.trackingProviders ?? [];
  if (providers.length === 0) {
    return NextResponse.json({ steps: [] }, { status: 404 });
  }
  const steps = providers.flatMap((p) => providerEvents[p.toLowerCase()] ?? []);
  if (!steps.length) {
    return NextResponse.json({ steps: [] }, { status: 404 });
  }
  return NextResponse.json({ steps });
}

