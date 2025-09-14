// apps/cms/src/app/cms/shop/[shop]/settings/stock-scheduler/page.tsx
import { getSettings, getStockCheckHistory } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";

const StockSchedulerEditor = dynamic(() => import("./StockSchedulerEditor"));
void StockSchedulerEditor;

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function StockSchedulerSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { shop } = await params;
  const settings = await getSettings(shop);
  const interval = settings.stockCheckService?.intervalMinutes ?? 60;
  const history = await getStockCheckHistory(shop);

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Stock Scheduler – {shop}</h2>
      <StockSchedulerEditor
        shop={shop}
        initialInterval={interval}
        history={history}
      />
    </div>
  );
}
