// apps/cms/src/app/cms/shop/[shop]/settings/late-fees/page.tsx

import dynamic from "next/dynamic";
import { getSettings } from "@cms/actions/shops.server";

import LateFeesTable from "./LateFeesTable";

const LateFeesEditor = dynamic(() => import("./LateFeesEditor"));
void LateFeesEditor;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function LateFeesSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const settings = await getSettings(shop);
  const lateFeeService = settings.lateFeeService ?? {
    enabled: false,
    intervalMinutes: 60,
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Late Fees – {shop}</h2>
      <LateFeesEditor shop={shop} initial={lateFeeService} />
      <h3 className="mt-8 mb-2 text-lg font-semibold">Charged late fees</h3>
      <LateFeesTable shop={shop} />
    </div>
  );
}
