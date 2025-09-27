// apps/cms/src/app/cms/shop/[shop]/settings/stock-alerts/page.tsx
import { getSettings } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { TranslationsProvider } from "@i18n/Translations";
import en from "@i18n/en.json";

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
  const t = await getTranslations("en");
  const settings = await getSettings(shop);
  const stockAlert = settings.stockAlert ?? { recipients: [] };

  return (
    <TranslationsProvider messages={en}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">
            {t("cms.stockAlerts.title", { shop })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("cms.stockAlerts.desc")}
          </p>
        </header>
        <StockAlertsEditor shop={shop} initial={stockAlert} />
      </div>
    </TranslationsProvider>
  );
}
