// apps/cms/src/actions/deployShop.server.ts
"use server";

import { deployShop, type DeployShopResult } from "@platform-core/createShop";
import { resolveDataRoot } from "@platform-core/dataRoot";
import fs from "fs/promises";
import path from "path";
import { writeJsonFile, withFileLock } from "@/lib/server/jsonIO";
import { ensureAuthorized } from "./common/auth";
import { validateShopName } from "@platform-core/shops";
import { verifyShopAfterDeploy } from "./verifyShopAfterDeploy.server";
import type { Environment } from "@acme/types";
import { recordStageTests } from "@/lib/server/launchGate";

// API status constant; not user-facing
const STATUS_PENDING = "pending"; // i18n-exempt -- INTL-000 API status label (non-UI) [ttl=2026-03-31]

export async function deployShopHosting(
  id: string,
  domain?: string,
  env?: Environment
): Promise<DeployShopResult> {
  await ensureAuthorized();
  const result = await deployShop(id, domain);

  const effectiveEnv: Environment = env ?? "stage";
  const timestamp = new Date().toISOString();

  try {
    const verification = await verifyShopAfterDeploy(id, effectiveEnv);
    result.env = effectiveEnv;
    result.testsStatus = verification.status;
    if (verification.error) {
      result.testsError = verification.error;
    }
    result.lastTestedAt = timestamp;
    if (effectiveEnv === "stage") {
      try {
        await recordStageTests(id, {
          status: verification.status,
          error: verification.error,
          at: timestamp,
          version: timestamp,
          smokeEnabled: process.env.SHOP_SMOKE_ENABLED === "1",
        });
      } catch {
        /* best-effort stage gate persistence */
      }
    }
  } catch (err) {
    result.env = effectiveEnv;
    result.testsStatus = "failed";
    result.testsError =
      (err as Error).message || "post-deploy verification failed";
    result.lastTestedAt = timestamp;
    if (effectiveEnv === "stage") {
      try {
        await recordStageTests(id, {
          status: "failed",
          error: result.testsError,
          at: timestamp,
          version: timestamp,
          smokeEnabled: process.env.SHOP_SMOKE_ENABLED === "1",
        });
      } catch {
        /* best-effort stage gate persistence */
      }
    }
  }

  try {
    await updateDeployStatus(id, {
      env: result.env,
      testsStatus: result.testsStatus,
      testsError: result.testsError,
      lastTestedAt: result.lastTestedAt,
    });
  } catch {
    // best-effort; failure to persist test metadata should not fail deployShopHosting
  }

  return result;
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
