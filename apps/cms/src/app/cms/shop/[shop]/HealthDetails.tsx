// apps/cms/src/app/cms/shop/[shop]/HealthDetails.tsx

import { deriveOperationalHealth } from "@platform-core/shops/health";
import { validateShopName } from "@platform-core/shops";

export const revalidate = 0;

export default async function HealthDetails({ shop }: { shop: string }) {
  let safeId: string;
  try {
    safeId = validateShopName(shop);
  } catch {
    return null;
  }

  let summary;
  try {
    summary = await deriveOperationalHealth(safeId);
  } catch {
    return null;
  }

  const url = summary.deploy?.url ?? summary.deploy?.previewUrl;
  const testsStatus = summary.deploy?.testsStatus;
  const testedAt = summary.deploy?.lastTestedAt;

  const testsLabel = (() => {
    if (testsStatus === "passed") return "Passed";
    if (testsStatus === "failed") return "Failed";
    if (!testsStatus || testsStatus === "not-run") return "Not run";
    return testsStatus;
  })();

  return (
    <section className="rounded-3xl border border-border/10 bg-surface-2 p-6 shadow-elevation-2 text-sm">
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        Health details
      </h2>
      <div className="space-y-1 text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Status:</span>{" "}
          {summary.status === "healthy"
            ? "Healthy"
            : summary.status === "broken"
              ? "Broken"
              : "Needs attention"}
        </p>
        <p>
          <span className="font-medium text-foreground">Upgrade:</span>{" "}
          {summary.upgradeStatus === "ok"
            ? "Last upgrade succeeded"
            : summary.upgradeStatus === "pending"
              ? "Last upgrade failed or requires attention"
              : "No upgrade history"}
          {summary.lastUpgradeTimestamp
            ? ` (last at ${summary.lastUpgradeTimestamp})`
            : ""}
        </p>
        {summary.deploy && (
          <>
            <p>
              <span className="font-medium text-foreground">Last deploy:</span>{" "}
              {summary.deploy.status}
              {summary.deploy.env ? ` (${summary.deploy.env})` : null}
            </p>
            {url && (
              <p>
                <span className="font-medium text-foreground">Runtime URL:</span>{" "}
                {url}
              </p>
            )}
            {summary.deploy.logsUrl && (
              <p>
                <span className="font-medium text-foreground">Logs:</span>{" "}
                {summary.deploy.logsUrl}
              </p>
            )}
            <p>
              <span className="font-medium text-foreground">
                Smoke tests:
              </span>{" "}
              {testsLabel}
              {testedAt
                ? ` @ ${new Date(testedAt).toLocaleString("en-GB", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : ""}
            </p>
          </>
        )}
        <p>
          <span className="font-medium text-foreground">Recent errors:</span>{" "}
          {(summary.errorCount ?? 0) > 0
            ? `${summary.errorCount} in last 24h${
                summary.lastErrorAt
                  ? ` (last @ ${new Date(
                      summary.lastErrorAt,
                    ).toLocaleString("en-GB", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })})`
                  : ""
              }`
            : "None recorded"}
        </p>
      </div>
      {summary.reasons.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="font-medium text-foreground">Signals contributing to status:</p>
          <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
            {summary.reasons.map((reason, idx) => (
              <li key={`${reason.code}-${idx}`}>{reason.message}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
