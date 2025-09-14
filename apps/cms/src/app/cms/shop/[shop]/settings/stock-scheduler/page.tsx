// apps/cms/src/app/cms/shop/[shop]/settings/stock-scheduler/page.tsx
import dynamic from "next/dynamic";
import { getSchedulerStatus } from "@cms/actions/stockScheduler.server";

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
  const status = (await getSchedulerStatus(shop)) ?? {
    intervalMs: 0,
    history: [],
  };
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Stock Scheduler – {shop}</h2>
      <StockSchedulerEditor shop={shop} status={status} />
    </div>
  );
}
