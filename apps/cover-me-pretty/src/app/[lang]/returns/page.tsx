// apps/cover-me-pretty/src/app/[lang]/returns/page.tsx
import {
  getReturnLogistics,
  getReturnBagAndLabel,
} from "@acme/platform-core/returnLogistics";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import shop from "../../../../shop.json";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { resolveLocale } from "@acme/i18n/locales";

import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const t = await getTranslations(resolveLocale(params.lang));
  return { title: t("returns.title") };
}

export default async function ReturnPolicyPage({
  params,
}: {
  params: { lang: string };
}) {
  const t = await getTranslations(resolveLocale(params.lang));
  const [cfg, info, settings] = await Promise.all([
    getReturnLogistics(),
    getReturnBagAndLabel(),
    getShopSettings(shop.id),
  ]);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">{t("returns.title")}</h1>
      {settings.returnService?.bagEnabled && (
        <p>{t("returns.reuseBag", { bagType: info.bagType })}</p>
      )}
      <p>{t("returns.labelsBy", { service: info.labelService.toUpperCase() })}</p>
      {cfg.dropOffProvider && (
        <p>{t("returns.dropOff", { provider: cfg.dropOffProvider })}</p>
      )}
      <p>{t("returns.carriers", { carriers: info.returnCarrier.join(", ") })}</p>
      {settings.returnService?.homePickupEnabled && (
        <p>
          {t("returns.pickupAvailableIn", {
            areas: info.homePickupZipCodes.join(", "),
          })}
        </p>
      )}
      <p>
        {cfg.inStore ? t("returns.inStoreAvailable") : t("returns.inStoreUnavailable")}
      </p>
      {typeof cfg.tracking !== "undefined" && (
        <p>
          {cfg.tracking ? t("returns.trackingEnabled") : t("returns.trackingDisabled")}
        </p>
      )}
      {cfg.requireTags && <p>{t("returns.requireTags")}</p>}
      {!cfg.allowWear && <p>{t("returns.noWear")}</p>}
    </div>
  );
}
