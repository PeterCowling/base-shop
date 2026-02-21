// apps/cover-me-pretty/src/app/[lang]/returns/page.tsx
import type { Metadata } from "next";

import { resolveLocale } from "@acme/i18n/locales";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import {
  getReturnBagAndLabel,
  getReturnLogistics,
} from "@acme/platform-core/returnLogistics";

import shop from "../../../../shop.json";

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations(resolveLocale(params.lang));
  return { title: t("returns.title") };
}

export default async function ReturnPolicyPage(
  props: {
    params: Promise<{ lang: string }>;
  }
) {
  const params = await props.params;
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
