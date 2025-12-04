// apps/cms/src/lib/listShops.ts

import fs from "fs/promises";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { logger } from "@acme/shared-utils";
import { validateShopName } from "@platform-core/shops";
import path from "path";

export async function listShops(): Promise<string[]> {
  const shopsDir = resolveDataRoot();

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: shopsDir is validated by resolveDataRoot()
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (err: unknown) {
    // If the shops directory hasn't been created yet, treat it as having
    // no shops rather than throwing. This allows callers to handle the empty
    // state gracefully.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    logger.error(`Failed to list shops at ${shopsDir}`, err);
    throw err;
  }
}

export type ShopSummary = {
  id: string;
  name: string;
  region?: string | null;
  lastUpgrade?: string | null;
  pending?: number;
  status?: "ready" | "failed" | "up_to_date" | "unknown";
};

export async function listShopSummaries(): Promise<ShopSummary[]> {
  const ids = await listShops();
  const summaries = await Promise.all(ids.map(readShopSummary));
  return summaries;
}

async function readShopSummary(id: string): Promise<ShopSummary> {
  const safeId = validateShopName(id);
  const shopsDir = resolveDataRoot();
  const deployFile = path.join(shopsDir, safeId, "deploy.json");

  const base: ShopSummary = {
    id: safeId,
    name: safeId,
    region: null,
    pending: 0,
    status: "unknown",
    lastUpgrade: null,
  };

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- OPS-3209 path constrained via validateShopName + data root [ttl=2026-06-30]
    const content = await fs.readFile(deployFile, "utf8");
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const testsStatus = typeof parsed.testsStatus === "string" ? parsed.testsStatus : undefined;
    const lastTestedAt =
      typeof parsed.lastTestedAt === "string" ? parsed.lastTestedAt : undefined;
    const region = typeof parsed.region === "string" ? parsed.region : null;
    const status: ShopSummary["status"] =
      testsStatus === "failed"
        ? "failed"
        : testsStatus === "passed"
          ? "up_to_date"
          : "ready";

    return {
      ...base,
      region,
      status,
      lastUpgrade: lastTestedAt ?? null,
    };
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      logger.error(`Failed to read deploy status for shop ${safeId}`, err);
    }
    return base;
  }
}
