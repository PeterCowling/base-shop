// apps/cms/src/app/cms/themes/page.tsx

import ThemesShopChooser from "./ThemesShopChooser.client";
import { Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";
import { TranslationsProvider } from "@i18n/Translations";
import en from "@i18n/en.json";

export default async function ThemesIndexPage() {
  const t = await getTranslations("en");
  const shops = await listShops();
  return (
    <TranslationsProvider messages={en}>
      <div className="space-y-8 text-foreground">
        <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
          <div className="relative space-y-4 px-6 py-8">
            <Tag variant="default">{t("cms.themes.chooseShop.tag")}</Tag>
            <h1 className="text-3xl font-semibold md:text-4xl">{t("cms.themes.chooseShop.heading")}</h1>
            <p className="text-sm text-hero-foreground/90">{t("cms.themes.chooseShop.desc")}</p>
          </div>
        </section>

        <ThemesShopChooser shops={shops} />
      </div>
    </TranslationsProvider>
  );
}
