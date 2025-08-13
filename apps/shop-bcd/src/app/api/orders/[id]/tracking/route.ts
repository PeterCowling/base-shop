// apps/shop-bcd/src/app/api/orders/[id]/tracking/route.ts
import { requirePermission } from "@auth";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { OrderStep } from "@ui/components/organisms/OrderTrackingTimeline";
import shop from "../../../../../../shop.json";

export const runtime = "edge";

interface ProviderResult {
  shipment?: OrderStep[];
  returns?: OrderStep[];
}

const providerFetchers: Record<string, (id: string) => Promise<ProviderResult>> = {
  UPS: async (_id: string) => ({
    shipment: [
      { label: "Package picked up", date: new Date().toISOString(), complete: true },
      { label: "In transit", complete: false },
    ],
  }),
  DHL: async (_id: string) => ({
    shipment: [
      { label: "Shipment info received", date: new Date().toISOString(), complete: true },
    ],
    returns: [],
  }),
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("view_orders");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getShopSettings(shop.id);
  const providers = settings.trackingProviders ?? [];
  if (!providers.length) {
    return NextResponse.json({ shipment: [], returns: [] });
  }

  const results = await Promise.all(
    providers.map(async (p) => {
      const fn = providerFetchers[p];
      return fn ? fn(params.id) : { shipment: [], returns: [] };
    })
  );

  const shipment = results.flatMap((r) => r.shipment ?? []);
  const returns = results.flatMap((r) => r.returns ?? []);
  return NextResponse.json({ shipment, returns });
}

