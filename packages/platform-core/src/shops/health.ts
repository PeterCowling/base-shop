import type { Environment } from "@acme/types";
import type { DeployInfo } from "./deployInfo";
import { readDeployInfo } from "./deployInfo";
import * as path from "node:path";
import * as fs from "node:fs";
import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops";

export type OperationalHealthStatus =
  | "healthy"
  | "needs-attention"
  | "broken";

export interface OperationalHealthReason {
  code:
    | "deploy-missing"
    | "deploy-error"
    | "tests-failed"
    | "tests-not-run"
    | "recent-errors"
    | "upgrade-failed";
  message: string;
}

export interface OperationalHealthSummary {
  status: OperationalHealthStatus;
  reasons: OperationalHealthReason[];
  deploy?: DeployInfo | null;
  errorCount?: number;
  lastErrorAt?: string;
  upgradeStatus?: "ok" | "pending" | "unknown";
  lastUpgradeTimestamp?: string;
}

interface HealthJson {
  recentErrorCount?: number;
  lastErrorAt?: string;
}

function healthFilePath(shopId: string): string {
  const id = validateShopName(shopId);
  return path.join(DATA_ROOT, id, "health.json");
}

export function readHealthJson(shopId: string): HealthJson | null {
  try {
    const fp = healthFilePath(shopId);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path derived from validated shopId and DATA_ROOT
    const content = fs.readFileSync(fp, "utf8");
    return JSON.parse(content) as HealthJson;
  } catch {
    return null;
  }
}

export function incrementOperationalError(shopId: string): void {
  try {
    const fp = healthFilePath(shopId);
    let data: HealthJson = {};
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path derived from validated shopId and DATA_ROOT
      const content = fs.readFileSync(fp, "utf8");
      data = JSON.parse(content) as HealthJson;
    } catch {
      // treat as empty
    }
    const next: HealthJson = {
      recentErrorCount: (data.recentErrorCount ?? 0) + 1,
      lastErrorAt: new Date().toISOString(),
    };
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path derived from validated shopId and DATA_ROOT
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path derived from validated shopId and DATA_ROOT
    fs.writeFileSync(fp, JSON.stringify(next), "utf8");
  } catch {
    // best-effort; ignore write failures
  }
}

interface UpgradeHistoryEntry {
  status?: string;
  timestamp?: string;
}

export function readLatestUpgrade(shopId: string): UpgradeHistoryEntry | null {
  try {
    const id = validateShopName(shopId);
    const historyPath = path.join(DATA_ROOT, id, "history.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path derived from validated shopId and DATA_ROOT
    const raw = fs.readFileSync(historyPath, "utf8");
    const data = JSON.parse(raw) as UpgradeHistoryEntry[];
    if (Array.isArray(data) && data.length > 0) {
      return data[data.length - 1] ?? null;
    }
  } catch {
    // no history yet
  }
  return null;
}

export const healthReaders = {
  readDeployInfo,
  readHealthJson,
  readLatestUpgrade,
};

export async function deriveOperationalHealth(
  shopId: string,
  env?: Environment,
): Promise<OperationalHealthSummary> {
  const info = healthReaders.readDeployInfo(shopId);
  const healthJson = healthReaders.readHealthJson(shopId);
  const latestUpgrade = healthReaders.readLatestUpgrade(shopId);

  if (!info) {
    return {
      status: "needs-attention",
      reasons: [
        {
          code: "deploy-missing",
          message: "No deploy.json found for shop.",
        },
      ],
      deploy: null,
    };
  }

  if (env && info.env && info.env !== env) {
    // Deploy info exists but targets a different environment; treat as missing
    return {
      status: "needs-attention",
      reasons: [
        {
          code: "deploy-missing",
          message: `No deploy info for env ${env}.`,
        },
      ],
      deploy: info,
    };
  }

  const reasons: OperationalHealthReason[] = [];

  if (info.status === "error") {
    reasons.push({
      code: "deploy-error",
      message: "Last deploy failed.",
    });
  }

  if (info.testsStatus === "failed") {
    reasons.push({
      code: "tests-failed",
      message: "Post-deploy smoke tests failed.",
    });
  } else if (!info.testsStatus || info.testsStatus === "not-run") {
    reasons.push({
      code: "tests-not-run",
      message: "Post-deploy smoke tests have not run.",
    });
  }

  let upgradeStatus: "ok" | "pending" | "unknown" = "unknown";
  let lastUpgradeTimestamp: string | undefined;
  if (latestUpgrade) {
    lastUpgradeTimestamp = latestUpgrade.timestamp;
    if (latestUpgrade.status === "failed") {
      upgradeStatus = "pending";
      reasons.push({
        code: "upgrade-failed",
        message: "Last upgrade failed or requires attention.",
      });
    } else if (latestUpgrade.status === "success") {
      upgradeStatus = "ok";
    }
  }

  if (healthJson && (healthJson.recentErrorCount ?? 0) > 0) {
    const last = healthJson.lastErrorAt ? Date.parse(healthJson.lastErrorAt) : NaN;
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (!Number.isNaN(last) && now - last <= TWENTY_FOUR_HOURS) {
      reasons.push({
        code: "recent-errors",
        message: "Recent operational errors recorded for this shop.",
      });
    }
  }

  let status: OperationalHealthStatus = "healthy";
  if (
    reasons.some((r) => r.code === "deploy-error" || r.code === "tests-failed")
  ) {
    status = "broken";
  } else if (reasons.length > 0) {
    status = "needs-attention";
  }

  return {
    status,
    reasons,
    deploy: info,
    errorCount: healthJson?.recentErrorCount ?? 0,
    lastErrorAt: healthJson?.lastErrorAt,
    upgradeStatus,
    lastUpgradeTimestamp,
  };
}
