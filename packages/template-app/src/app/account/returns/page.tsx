import {
  getReturnLogistics,
  getReturnBagAndLabel,
} from "@platform-core/returnLogistics";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import { useTranslations as useServerTranslations } from "@i18n/useTranslations.server";

const SHOP_ID = "bcd";
import CleaningInfo from "../../../components/CleaningInfo";
import shop from "../../../../shop.json";
import ReturnForm from "./ReturnForm";

export async function generateMetadata() {
  const tBase = await useServerTranslations("en");
  const t = (key: string) => tBase(`account.returns.${key}`);
  return { title: t("metaTitle") };
}

export default async function ReturnsPage() {
  const tBase = await useServerTranslations("en");
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
