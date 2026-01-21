// apps/cms/src/app/cms/shop/page.tsx

import { useTranslations as serverUseTranslations } from "@acme/i18n/useTranslations.server";
import { Tag } from "@acme/ui/components/atoms";

import { listShops } from "../../../lib/listShops";

import ShopIndexShopChooser from "./ShopIndexShopChooser.client";

// i18n-exempt: Static SEO title with brand; not user-facing runtime copy
export const metadata = {
  title: "Choose shop · Base-Shop", // i18n-exempt: Static SEO title with brand; not user-facing runtime copy
};

export default async function ShopIndexPage() {
  const t = await serverUseTranslations("en");
  const shops = await listShops();
  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default">{t("Operations · Choose a shop")}</Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            {t("Launch operations from the right storefront")}
          </h1>
          <p className="text-sm text-hero-foreground/80">
            {t(
              "Select a shop to review health, automate workflows, and dive into analytics tailored to that storefront."
            )}
          </p>
        </div>
      </section>

      <ShopIndexShopChooser shops={shops} />
    </div>
  );
}
