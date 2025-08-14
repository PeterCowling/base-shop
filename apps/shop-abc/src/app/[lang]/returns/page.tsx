// apps/shop-abc/src/app/[lang]/returns/page.tsx
import { getReturnLogistics } from "@platform-core/returnLogistics";

export const metadata = { title: "Return policy" };

export default async function ReturnPolicyPage() {
  const cfg = await getReturnLogistics();
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Return policy</h1>
      <p>Return labels provided by {cfg.labelService}.</p>
      {cfg.dropOffProvider && (
        <p>
          Drop-off: {cfg.dropOffProvider}
          {cfg.dropOffProvider.toLowerCase() === "ups" &&
            " – bring your package to any UPS drop-off location."}
        </p>
      )}
      <p>In-store returns {cfg.inStore ? "available" : "unavailable"}.</p>
      {typeof cfg.tracking !== "undefined" && (
        <p>
          Tracking {cfg.tracking ? "enabled" : "disabled"}
          {cfg.tracking && " and numbers provided with each label."}
        </p>
      )}
      {typeof cfg.requireTags !== "undefined" && (
        <p>
          {cfg.requireTags
            ? "Original tags must be attached for returns."
            : "Tags are not required for returns."}
        </p>
      )}
      {typeof cfg.allowWear !== "undefined" && (
        <p>
          {cfg.allowWear
            ? "Items showing normal wear are accepted."
            : "Items must be returned unworn."}
        </p>
      )}
    </div>
  );
}
