// apps/cms/src/actions/deployShop.server.ts
"use server";

import { deployShop, type DeployShopResult } from "@platform-core/createShop";
import { resolveDataRoot } from "@platform-core/dataRoot";
import fs from "fs/promises";
import path from "path";
import { writeJsonFile, withFileLock } from "@/lib/server/jsonIO";
import { ensureAuthorized } from "./common/auth";
import { validateShopName } from "@platform-core/shops";

export async function deployShopHosting(
  id: string,
  domain?: string
): Promise<DeployShopResult> {
  await ensureAuthorized();
  return deployShop(id, domain);
}

export async function getDeployStatus(
  id: string
): Promise<DeployShopResult | { status: "pending"; error?: string }> {
  await ensureAuthorized();
  try {
    const safe = validateShopName(id);
    const file = path.join(resolveDataRoot(), safe, "deploy.json");
    // Path constrained to workspace data root and validated shop id
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = await fs.readFile(file, "utf8");
    return JSON.parse(content) as DeployShopResult;
  } catch (err) {
    console.error("Failed to read deploy status", err);
    return { status: "pending", error: (err as Error).message };
  }
}

export async function updateDeployStatus(
  id: string,
  data: Partial<DeployShopResult> & {
    domain?: string;
    domainStatus?: string;
    certificateStatus?: string;
  }
): Promise<void> {
  await ensureAuthorized();
  const safe = validateShopName(id);
  const file = path.join(resolveDataRoot(), safe, "deploy.json");
  try {
    await withFileLock(file, async () => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const existing = await fs.readFile(file, "utf8").catch(() => "{}");
      const parsed = JSON.parse(existing) as Record<string, unknown>;
      const updated = { ...parsed, ...data };
      await writeJsonFile(file, updated);
    });
  } catch (err) {
    console.error("Failed to write deploy status", err);
  }

  if (data.domain) {
    try {
      const { updateShopInRepo } = await import(
        "@platform-core/repositories/shop.server"
      );
      await updateShopInRepo(id, {
        id,
        domain: {
          name: data.domain,
          status: data.domainStatus,
          certificateStatus: data.certificateStatus,
        },
      });
    } catch (err) {
      console.error("Failed to update shop domain", err);
    }
  }
}
