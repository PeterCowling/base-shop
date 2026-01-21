// apps/cms/src/app/cms/shop/[shop]/settings/deposits/page.tsx

import dynamic from "next/dynamic";
import { getSettings } from "@cms/actions/shops.server";

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
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Deposits – {shop}</h2>
        <p className="text-sm text-muted-foreground">
          Control how often escrowed funds are released to the shop.
        </p>
      </header>
      <DepositsEditor shop={shop} initial={depositService} />
    </div>
  );
}
