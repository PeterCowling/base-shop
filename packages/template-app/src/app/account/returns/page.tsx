import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import {
  getReturnBagAndLabel,
  getReturnLogistics,
} from "@acme/platform-core/returnLogistics";

import shop from "../../../../shop.json";
import CleaningInfo from "../../../components/CleaningInfo";

import ReturnForm from "./ReturnForm";

const SHOP_ID = "bcd";

export async function generateMetadata() {
  const tBase = await getServerTranslations("en");
  const t = (key: string) => tBase(`account.returns.${key}`);
  return { title: t("metaTitle") };
}

export default async function ReturnsPage() {
  const tBase = await getServerTranslations("en");
  const t = (key: string) => tBase(`account.returns.${key}`);
  const [cfg, info, settings] = await Promise.all([
    getReturnLogistics(),
    getReturnBagAndLabel(),
    getShopSettings(SHOP_ID),
  ]);
  if (!cfg.mobileApp) {
    return <p className="p-6">{t("mobileDisabled")}</p>;
  }
  const bagType = settings.returnService?.bagEnabled ? info.bagType : undefined;
  const tracking = info.tracking;
  return (
    <>
      <ReturnForm bagType={bagType} tracking={tracking} />
      {shop.showCleaningTransparency && <CleaningInfo />}
    </>
  );
}
