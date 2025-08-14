// apps/cms/src/app/cms/shop/[shop]/settings/stock-alerts/page.tsx
import { getStockAlertConfig } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";

const StockAlertsEditor = dynamic(() => import("./StockAlertsEditor"));
void StockAlertsEditor;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function StockAlertsSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const config = await getStockAlertConfig(shop);
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Stock Alerts – {shop}</h2>
      <StockAlertsEditor shop={shop} initial={config} />
    </div>
  );
}

