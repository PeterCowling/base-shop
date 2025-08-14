// apps/shop-abc/src/app/api/orders/[id]/tracking/route.ts
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
  // Rental or high-volume shops may disable tracking by leaving this empty.
  const providers = (settings.trackingProviders ?? []).map((p) =>
    p.toLowerCase(),
  );
  if (providers.length === 0) {
    return NextResponse.json({ steps: [] }, { status: 404 });
  }
  const steps = providers.flatMap((p) => providerEvents[p] ?? []);
  if (!steps.length) {
    return NextResponse.json({ steps: [] }, { status: 404 });
  }
  // In a real implementation the order id would be used to query providers.
  return NextResponse.json({ steps });
}

