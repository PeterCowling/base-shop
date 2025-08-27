import {
  getReturnLogistics,
  getReturnBagAndLabel,
} from "@platform-core/returnLogistics";
import { getShopSettings } from "@platform-core/repositories/settings.server";

const SHOP_ID = "bcd";
import CleaningInfo from "../../../components/CleaningInfo";
import shop from "../../../../shop.json";
import ReturnForm from "./ReturnForm";

export const metadata = { title: "Mobile Returns" };

export default async function ReturnsPage() {
  const [cfg, info, settings] = await Promise.all([
    getReturnLogistics(),
    getReturnBagAndLabel(),
    getShopSettings(SHOP_ID),
  ]);
  if (!cfg.mobileApp) {
    return <p className="p-6">Mobile returns are not enabled.</p>;
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
