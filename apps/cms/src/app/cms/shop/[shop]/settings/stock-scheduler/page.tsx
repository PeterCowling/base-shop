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
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Stock Scheduler – {shop}</h2>
        <p className="text-sm text-muted-foreground">
          Control how often automated inventory checks run for this shop.
        </p>
      </header>
      <StockSchedulerEditor shop={shop} status={status} />
    </div>
  );
}
