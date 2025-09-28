// apps/cms/src/actions/deployShop.server.ts
"use server";

import { deployShop, type DeployShopResult } from "@platform-core/createShop";
import { resolveDataRoot } from "@platform-core/dataRoot";
import fs from "fs/promises";
import path from "path";
import { writeJsonFile, withFileLock } from "@/lib/server/jsonIO";
import { ensureAuthorized } from "./common/auth";
import { validateShopName } from "@platform-core/shops";

// API status constant; not user-facing
const STATUS_PENDING = "pending"; // i18n-exempt -- INTL-000 API status label (non-UI) [ttl=2026-03-31]

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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123
    const content = await fs.readFile(file, "utf8");
    return JSON.parse(content) as DeployShopResult;
  } catch (err) {
    console.error("Failed to read deploy status", err); // i18n-exempt -- INTL-000 server log label (non-UI) [ttl=2026-03-31]
    return { status: STATUS_PENDING, error: (err as Error).message };
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
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123
      const existing = await fs.readFile(file, "utf8").catch(() => "{}");
      const parsed = JSON.parse(existing) as Record<string, unknown>;
      const updated = { ...parsed, ...data };
      await writeJsonFile(file, updated);
    });
  } catch (err) {
    console.error("Failed to write deploy status", err); // i18n-exempt -- INTL-000 [ttl=2026-03-31] server log label (non-UI)
  }

  if (data.domain) {
    try {
      // i18n-exempt -- CMS-2651 [ttl=2026-01-01] non-UI module specifier
      const { updateShopInRepo } = await import(
        "@platform-core/repositories/shop.server" // i18n-exempt -- CMS-2651 [ttl=2026-01-01] non-UI module specifier
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
      console.error("Failed to update shop domain", err); // i18n-exempt -- INTL-000 server log label (non-UI) [ttl=2026-03-31]
    }
  }
}
