// apps/cms/src/app/cms/shop/[shop]/settings/premier-delivery/page.tsx
import dynamic from "next/dynamic";
import { getSettings } from "@cms/actions/shops.server";

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
  const premierDelivery = settings.premierDelivery ?? {
    regions: [],
    windows: [],
    carriers: [],
    surcharge: undefined,
    serviceLabel: undefined,
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Premier Delivery – {shop}</h2>
        <p className="text-sm text-muted-foreground">
          Configure regions, delivery windows, and fulfillment partners for the
          premium experience.
        </p>
      </header>
      <PremierDeliveryEditor shop={shop} initial={premierDelivery} />
    </div>
  );
}
