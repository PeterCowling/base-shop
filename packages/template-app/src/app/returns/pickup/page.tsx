import { getReturnLogistics } from "@platform-core/returnLogistics";
import CleaningInfo from "../../../components/CleaningInfo";
import { readShop } from "@platform-core/src/repositories/shops.server";
import { coreEnv } from "@acme/config/env/core";

export const metadata = { title: "Schedule pickup" };

export default async function PickupPage({
  searchParams,
}: {
  searchParams?: { zip?: string };
}) {
  const shop = await readShop(coreEnv.NEXT_PUBLIC_DEFAULT_SHOP || "shop");
  if (!shop.returnsEnabled || shop.type !== "rental") {
    return <p className="p-6">Returns are not enabled.</p>;
  }
  const cfg = await getReturnLogistics();
  const allowed = cfg.homePickupZipCodes;
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
      {shop.showCleaningTransparency && <CleaningInfo />}
    </div>
  );
}
