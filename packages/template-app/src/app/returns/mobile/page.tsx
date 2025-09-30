import {
  getReturnLogistics,
  getReturnBagAndLabel,
} from "@platform-core/returnLogistics";
import {
  getShopSettings,
  readShop,
} from "@platform-core/repositories/shops.server";
import CleaningInfo from "../../../components/CleaningInfo";
import Scanner from "./Scanner";

const SHOP_ID = "bcd";
// i18n-exempt -- ABC-123 [ttl=2025-12-31] static metadata; app-level routes localize this
export const metadata = { title: "Mobile Returns" };

import { useTranslations as getServerTranslations } from "@i18n/useTranslations.server";
import type { Locale } from "@i18n/locales";

export default async function MobileReturnPage() {
  const [cfg, info, settings, shop] = await Promise.all([
    getReturnLogistics(),
    getReturnBagAndLabel(),
    getShopSettings(SHOP_ID),
    readShop(SHOP_ID),
  ]);
  const t = await getServerTranslations("en" as Locale);
  if (!cfg.mobileApp) {
    return <p className="p-6">{t("returns.mobile.disabled")}</p>;
  }
  const allowed = settings.returnService?.homePickupEnabled
    ? info.homePickupZipCodes
    : [];
  return (
    <>
      <Scanner allowedZips={allowed} />
      {shop.showCleaningTransparency && <CleaningInfo />}
    </>
  );
}
