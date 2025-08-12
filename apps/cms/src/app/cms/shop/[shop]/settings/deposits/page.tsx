// apps/cms/src/app/cms/shop/[shop]/settings/deposits/page.tsx

import { getSettings } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";

const DepositsEditor = dynamic(() => import("./DepositsEditor"));
void DepositsEditor;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function DepositsSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const settings = await getSettings(shop);
  const depositService = settings.depositService ?? {
    enabled: false,
    intervalMinutes: 60,
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Deposits – {shop}</h2>
      <DepositsEditor shop={shop} initial={depositService} />
    </div>
  );
}

