// apps/cms/src/app/cms/shop/[shop]/UpgradeState.tsx

import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { validateShopName } from "@acme/platform-core/shops";
import fs from "fs/promises";
import path from "path";

export const revalidate = 0;

type HistoryEntry = {
  componentVersions?: Record<string, string>;
  lastUpgrade?: string;
  timestamp?: string;
};

export default async function UpgradeState({ shop }: { shop: string }) {
  let safeId: string;
  try {
    safeId = validateShopName(shop);
  } catch {
    return null;
  }

  const root = resolveDataRoot();
  const dir = path.join(root, safeId);
  const shopJsonPath = path.join(dir, "shop.json");
  const upgradePath = path.join(dir, "upgrade.json");
  const historyPath = path.join(dir, "history.json");

  let lastUpgrade: string | undefined;
  let currentComponents: Record<string, string> | undefined;
  let stagedUpgrade: { timestamp?: string; componentsCount: number } | null =
    null;
  let historyCount = 0;
  let lastHistoryEntry: HistoryEntry | undefined;

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-5001 path derived from validated shop id and data root
    const raw = await fs.readFile(shopJsonPath, "utf8");
    const data = JSON.parse(raw) as {
      lastUpgrade?: string;
      componentVersions?: Record<string, string>;
    };
    lastUpgrade = data.lastUpgrade;
    currentComponents = data.componentVersions;
  } catch {
    // ignore; shop.json may not exist in some environments
  }

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-5001 path derived from validated shop id and data root
    const raw = await fs.readFile(upgradePath, "utf8");
    const data = JSON.parse(raw) as {
      timestamp?: string;
      components?: unknown[];
    };
    stagedUpgrade = {
      timestamp: data.timestamp,
      componentsCount: Array.isArray(data.components)
        ? data.components.length
        : 0,
    };
  } catch {
    // no staged upgrade
  }

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CMS-5001 path derived from validated shop id and data root
    const raw = await fs.readFile(historyPath, "utf8");
    const data = JSON.parse(raw) as HistoryEntry[];
    if (Array.isArray(data)) {
      historyCount = data.length;
      lastHistoryEntry = data[data.length - 1];
    }
  } catch {
    // no history yet
  }

  if (!lastUpgrade && !stagedUpgrade && historyCount === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border/10 bg-surface-2 p-6 shadow-elevation-2">
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        Upgrade status
      </h2>
      <div className="space-y-2 text-sm text-muted-foreground">
        {lastUpgrade && (
          <p>
            <span className="font-medium text-foreground">
              Last published upgrade:
            </span>{" "}
            {lastUpgrade}
          </p>
        )}
        {currentComponents && Object.keys(currentComponents).length > 0 && (
          <p>
            <span className="font-medium text-foreground">
              Tracked components:
            </span>{" "}
            {Object.keys(currentComponents).length}
          </p>
        )}
        {stagedUpgrade && (
          <p>
            <span className="font-medium text-foreground">
              Staged upgrade:
            </span>{" "}
            {stagedUpgrade.timestamp ?? "pending"} (
            {stagedUpgrade.componentsCount} components)
          </p>
        )}
        {historyCount > 0 && (
          <p>
            <span className="font-medium text-foreground">
              Upgrade history entries:
            </span>{" "}
            {historyCount}
            {lastHistoryEntry?.timestamp
              ? ` (last at ${lastHistoryEntry.timestamp})`
              : null}
          </p>
        )}
      </div>
    </section>
  );
}
