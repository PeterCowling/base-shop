// apps/cms/src/app/cms/shop/[shop]/settings/reverse-logistics/page.tsx

import dynamic from "next/dynamic";
import { getSettings } from "@cms/actions/shops.server";

const ReverseLogisticsEditor = dynamic(() => import("./ReverseLogisticsEditor"));
void ReverseLogisticsEditor;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function ReverseLogisticsSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const settings = await getSettings(shop);
  const reverseLogistics = settings.reverseLogisticsService ?? {
    enabled: false,
    intervalMinutes: 60,
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Reverse Logistics – {shop}</h2>
        <p className="text-sm text-muted-foreground">
          Coordinate return-to-vendor and refurbishment workflows on a schedule.
        </p>
      </header>
      <ReverseLogisticsEditor shop={shop} initial={reverseLogistics} />
    </div>
  );
}
