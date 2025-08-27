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

export const metadata = { title: "Mobile Returns" };

export default async function MobileReturnPage() {
  const [cfg, info, settings, shop] = await Promise.all([
    getReturnLogistics(),
    getReturnBagAndLabel(),
    getShopSettings(SHOP_ID),
    readShop(SHOP_ID),
  ]);
  if (!cfg.mobileApp) {
    return <p className="p-6">Mobile returns are not enabled.</p>;
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
