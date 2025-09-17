// apps/cms/src/app/cms/shop/[shop]/settings/premier-delivery/page.tsx
import { getSettings } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";

const PremierDeliveryEditor = dynamic(() => import("./PremierDeliveryEditor"));
void PremierDeliveryEditor;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function PremierDeliverySettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const settings = await getSettings(shop);
  const premierDelivery =
    settings.premierDelivery ?? {
      regions: [],
      windows: [],
      carriers: [],
      surcharge: undefined,
      serviceLabel: undefined,
    };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Premier Delivery – {shop}</h2>
      <PremierDeliveryEditor shop={shop} initial={premierDelivery} />
    </div>
  );
}
