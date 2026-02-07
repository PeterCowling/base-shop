import dynamic from "next/dynamic";

import { Alert } from "@acme/design-system/atoms";
import { useTranslations } from "@acme/i18n";
import type { Shop } from "@acme/types";

import { Card, CardContent } from "@/components/atoms/shadcn";

const ShopEditor = dynamic(() => import("../ShopEditor"));
void ShopEditor;
const CurrencyTaxEditor = dynamic(() => import("../CurrencyTaxEditor"));
void CurrencyTaxEditor;

interface AdminToolsProps {
  readonly isAdmin: boolean;
  readonly shop: string;
  readonly shopInfo: Shop;
  readonly trackingProviders: string[];
  readonly currency: string;
  readonly taxRegion: string;
}

export default function AdminTools({
  isAdmin,
  shop,
  shopInfo,
  trackingProviders,
  currency,
  taxRegion,
}: AdminToolsProps) {
  const t = useTranslations();
  const ADMIN_TOOLS_HEADING_ID = "admin-tools-heading";
  if (!isAdmin) {
    return (
      <Alert
        variant="warning"
        tone="soft"
        heading={t("cms.shop.adminTools.viewerDisabled")}
      />
    );
  }

  return (
    <section id="admin-tools" aria-labelledby={ADMIN_TOOLS_HEADING_ID} className="space-y-4">
      <div className="space-y-2">
        <h2 id={ADMIN_TOOLS_HEADING_ID} className="text-xl font-semibold">
          {t("cms.shop.adminTools.heading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("cms.shop.adminTools.description")}
        </p>
      </div>
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{t("cms.shop.adminTools.profile.heading")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("cms.shop.adminTools.profile.description")}
            </p>
            <p className="text-xs text-muted-foreground">
              <a
                href="/docs/commerce-charter.md"
                target="_blank"
                rel="noreferrer"
                className="underline-offset-2 hover:underline"
              >
                {t("cms.shop.adminTools.profile.docsLink")}
              </a>
            </p>
          </div>
          <ShopEditor
            shop={shop}
            initial={shopInfo}
            initialTrackingProviders={trackingProviders}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{t("cms.shop.adminTools.currencyTax.heading")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("cms.shop.adminTools.currencyTax.description")}
            </p>
          </div>
          <CurrencyTaxEditor
            shop={shop}
            initial={{
              currency,
              taxRegion,
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
