// apps/shop-bcd/src/app/[lang]/returns/page.tsx
import {
  getReturnLogistics,
  getReturnBagAndLabel,
} from "@platform-core/returnLogistics";

export const metadata = { title: "Return policy" };

export default async function ReturnPolicyPage() {
  const cfg = await getReturnLogistics();
  const bag = await getReturnBagAndLabel();
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Return policy</h1>
      <p>Return labels provided by {bag.labelService}.</p>
      {cfg.dropOffProvider && <p>Drop-off: {cfg.dropOffProvider}</p>}
      <p>In-store returns {cfg.inStore ? "available" : "unavailable"}.</p>
      {typeof cfg.tracking !== "undefined" && (
        <p>Tracking {cfg.tracking ? "enabled" : "disabled"}.</p>
      )}
      {cfg.requireTags && <p>Items must have all tags attached for return.</p>}
      {!cfg.allowWear && <p>Items showing signs of wear may be rejected.</p>}
    </div>
  );
}
