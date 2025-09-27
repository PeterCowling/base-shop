// apps/cms/src/app/cms/shop/[shop]/settings/stock-scheduler/page.tsx
import dynamic from "next/dynamic";
import { getSchedulerStatus } from "@cms/actions/stockScheduler.server";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { TranslationsProvider } from "@i18n/Translations";
import en from "@i18n/en.json";

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
  const t = await getTranslations("en");
  const status = (await getSchedulerStatus(shop)) ?? {
    intervalMs: 0,
    history: [],
  };
  return (
    <TranslationsProvider messages={en}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">{t("cms.stockScheduler.title", { shop })}</h2>
          <p className="text-sm text-muted-foreground">
            {t("cms.stockScheduler.desc")}
          </p>
        </header>
        <StockSchedulerEditor shop={shop} status={status} />
      </div>
    </TranslationsProvider>
  );
}
