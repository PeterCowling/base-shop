import { getReturnBagAndLabel } from "@platform-core/returnLogistics";
import {
  getShopSettings,
  readShop,
} from "@platform-core/repositories/shops.server";

const SHOP_ID = "bcd";
import CleaningInfo from "../../../components/CleaningInfo";
// i18n-exempt -- ABC-123 [ttl=2025-12-31] static metadata; app-level routes localize this
export const metadata = { title: "Schedule pickup" };
import { useTranslations as getServerTranslations } from "@i18n/useTranslations.server";
import type { Locale } from "@i18n/locales";

export default async function PickupPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string }>;
}) {
  const { zip = "" } = await searchParams;
  const [info, settings, shop] = await Promise.all([
    getReturnBagAndLabel(),
    getShopSettings(SHOP_ID),
    readShop(SHOP_ID),
  ]);
  const t = await getServerTranslations("en" as Locale);
  const allowed = settings.returnService?.homePickupEnabled
    ? info.homePickupZipCodes
    : [];
  const isAllowed = zip ? allowed.includes(zip) : false;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">{t("returns.pickup.title")}</h1>
      {zip ? (
        isAllowed ? (
          <p>{`${t("returns.pickup.scheduledFor") as string} ${zip}`}</p>
        ) : (
          <p>{t("returns.pickup.unavailable")}</p>
        )
      ) : (
        <form className="space-x-2">
          <input
            name="zip"
            placeholder={t("returns.pickup.zipPlaceholder") as string}
            className="border p-2"
          />
          <button type="submit" className="px-4 py-2 bg-primary text-white min-h-10 min-w-10">
            {t("returns.pickup.check")}
          </button>
        </form>
      )}
      {shop.showCleaningTransparency && <CleaningInfo />}
    </div>
  );
}
