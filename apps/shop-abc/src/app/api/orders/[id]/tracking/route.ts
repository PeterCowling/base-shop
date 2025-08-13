// apps/shop-abc/src/app/api/orders/[id]/tracking/route.ts
import { NextResponse } from "next/server";
import type { OrderStep } from "@ui/components/organisms/OrderTrackingTimeline";
import { getShopSettings } from "@platform-core/src/repositories/settings.server";
import shop from "../../../../../../shop.json";

export const runtime = "edge";

async function fetchUpsEvents(id: string): Promise<OrderStep[]> {
  return [
    { label: "Shipped", date: new Date().toISOString(), complete: true },
    { label: "Out for delivery", complete: false },
  ];
}

async function fetchDhlEvents(id: string): Promise<OrderStep[]> {
  return [
    { label: "Processed", date: new Date().toISOString(), complete: true },
  ];
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const settings = await getShopSettings(shop.id);
  const providers = settings.trackingProviders ?? [];
  const steps: OrderStep[] = [];
  for (const p of providers) {
    switch (p.toLowerCase()) {
      case "ups":
        steps.push(...(await fetchUpsEvents(params.id)));
        break;
      case "dhl":
        steps.push(...(await fetchDhlEvents(params.id)));
        break;
      default:
        break;
    }
  }
  return NextResponse.json({ steps });
}

