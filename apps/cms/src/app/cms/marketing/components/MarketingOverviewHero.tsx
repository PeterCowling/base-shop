import { useTranslations } from "@acme/i18n";

export function MarketingOverviewHero() {
  const t = useTranslations();
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-foreground">{t("cms.marketing.overview.heading")}</h1>
      <p className="text-sm text-muted-foreground">{t("cms.marketing.overview.subheading")}</p>
    </header>
  );
}

export default MarketingOverviewHero;
