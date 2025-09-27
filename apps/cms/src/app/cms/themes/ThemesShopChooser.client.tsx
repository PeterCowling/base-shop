"use client";

import ShopChooser from "@/components/cms/ShopChooser";
import { useTranslations } from "@i18n/Translations";

export default function ThemesShopChooser({ shops }: { shops: string[] }) {
  const t = useTranslations();
  return (
    <ShopChooser
      tag={t("cms.themes.studios.tag")}
      heading={t("cms.themes.studios.heading")}
      subheading={t("cms.themes.studios.subheading")}
      shops={shops}
      card={{
        icon: "🎨",
        title: (shop) => shop.toUpperCase(),
        description: (shop) => t("cms.themes.card.description", { shop }),
        ctaLabel: () => t("cms.themes.card.cta"),
        href: (shop) => `/cms/shop/${shop}/themes`,
        analyticsEventName: "shopchooser:navigate",
        analyticsPayload: (shop) => ({ area: "themes", shop }),
      }}
      emptyState={{
        tagLabel: t("cms.themes.empty.tagLabel"),
        title: t("cms.themes.empty.title"),
        description: t("cms.themes.empty.description"),
        ctaLabel: t("cms.themes.empty.cta"),
        ctaHref: "/cms/configurator",
        analyticsEventName: "shopchooser:create",
        analyticsPayload: { area: "themes" },
      }}
    />
  );
}
