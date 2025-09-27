// apps/shop-bcd/src/app/api/orders/[id]/tracking/route.ts
import { NextResponse } from "next/server";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import type { OrderStep } from "@ui/components/organisms/OrderTrackingTimeline";
import shop from "../../../../../../shop.json";
import { useTranslations } from "@acme/i18n/useTranslations.server";

type ProviderEvent = { key: string; date?: string; complete: boolean };
const providerEventKeys: Record<string, ProviderEvent[]> = {
  ups: [
    { key: "tracking.ups.pickedUp", date: "2024-01-01", complete: true },
    { key: "tracking.ups.outForDelivery", complete: false },
  ],
  dhl: [
    { key: "tracking.dhl.processedAtFacility", date: "2024-01-01", complete: true },
    { key: "tracking.dhl.inTransit", complete: false },
  ],
};

export async function GET(
  _req: Request,
  { params: _params }: { params: { id: string } }
) {
  const t = await useTranslations("en");
  const settings = await getShopSettings(shop.id);
  // Rental or high-volume shops may disable tracking by leaving this empty.
  const providers = (settings.trackingProviders ?? []).map((p) =>
    p.toLowerCase(),
  );
  if (providers.length === 0) {
    return NextResponse.json({ steps: [] }, { status: 404 });
  }
  const steps: OrderStep[] = providers.flatMap((p) =>
    (providerEventKeys[p] ?? []).map(({ key, ...rest }) => ({
      label: t(key),
      ...rest,
    })),
  );
  if (!steps.length) {
    return NextResponse.json({ steps: [] }, { status: 404 });
  }
  return NextResponse.json({ steps });
}
