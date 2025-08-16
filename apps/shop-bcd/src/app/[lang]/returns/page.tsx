// apps/shop-bcd/src/app/[lang]/returns/page.tsx
import {
  getReturnLogistics,
  getReturnBagAndLabel,
} from "@platform-core/returnLogistics";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import shop from "../../../../shop.json";

export const metadata = { title: "Return policy" };

export default async function ReturnPolicyPage() {
  const [cfg, info, settings] = await Promise.all([
    getReturnLogistics(),
    getReturnBagAndLabel(),
    getShopSettings(shop.id),
  ]);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Return policy</h1>
      {settings.returnService?.bagEnabled && (
        <p>Please reuse the {info.bagType} bag for your return.</p>
      )}
      <p>Return labels provided by {info.labelService.toUpperCase()}.</p>
      {cfg.dropOffProvider && <p>Drop-off: {cfg.dropOffProvider}</p>}
      <p>Available carriers: {info.returnCarrier.join(", ")}</p>
      {settings.returnService?.homePickupEnabled && (
        <p>
          Home pickup available in: {info.homePickupZipCodes.join(", ")}
        </p>
      )}
      <p>In-store returns {cfg.inStore ? "available" : "unavailable"}.</p>
      {typeof cfg.tracking !== "undefined" && (
        <p>Tracking {cfg.tracking ? "enabled" : "disabled"}.</p>
      )}
      {cfg.requireTags && <p>Items must have all tags attached for return.</p>}
      {!cfg.allowWear && <p>Items showing signs of wear may be rejected.</p>}
    </div>
  );
}
