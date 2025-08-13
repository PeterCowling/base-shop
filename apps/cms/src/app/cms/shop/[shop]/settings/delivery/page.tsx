// apps/cms/src/app/cms/shop/[shop]/settings/delivery/page.tsx
import { getSettings } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";

const DeliveryEditor = dynamic(() => import("./DeliveryEditor"));
void DeliveryEditor;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function DeliverySettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const settings = await getSettings(shop);
  const premierDelivery = settings.premierDelivery ?? {
    regions: [],
    windows: [],
  };
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Premier Delivery – {shop}</h2>
      <DeliveryEditor shop={shop} initial={premierDelivery} />
    </div>
  );
}

