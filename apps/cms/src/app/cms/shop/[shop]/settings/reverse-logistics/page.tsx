// apps/cms/src/app/cms/shop/[shop]/settings/reverse-logistics/page.tsx

import { getSettings } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";

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
    <div>
      <h2 className="mb-4 text-xl font-semibold">Reverse Logistics – {shop}</h2>
      <ReverseLogisticsEditor shop={shop} initial={reverseLogistics} />
    </div>
  );
}
