import { getReturnBagAndLabel } from "@platform-core/returnLogistics";
import { getShopSettings } from "@platform-core/repositories/settings.server";

const SHOP_ID = "bcd";
import CleaningInfo from "../../../components/CleaningInfo";

export const metadata = { title: "Schedule pickup" };

export default async function PickupPage({
  searchParams,
}: {
  searchParams?: { zip?: string };
}) {
  const [info, settings] = await Promise.all([
    getReturnBagAndLabel(),
    getShopSettings(SHOP_ID),
  ]);
  const allowed = settings.returnService?.homePickupEnabled
    ? info.homePickupZipCodes
    : [];
  const zip = searchParams?.zip || "";
  const isAllowed = zip ? allowed.includes(zip) : false;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Schedule Home Pickup</h1>
      {zip ? (
        isAllowed ? (
          <p>Your pickup has been scheduled for ZIP {zip}.</p>
        ) : (
          <p>Sorry, home pickup is not available in your area.</p>
        )
      ) : (
        <form className="space-x-2">
          <input
            name="zip"
            placeholder="ZIP code"
            className="border p-2"
          />
          <button type="submit" className="px-4 py-2 bg-primary text-white">
            Check
          </button>
        </form>
      )}
      {settings.showCleaningTransparency && <CleaningInfo />}
    </div>
  );
}
