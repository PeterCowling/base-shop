// packages/platform-core/src/createShop/deploymentAdapter.ts

import { spawnSync } from "child_process";
import { join } from "path";
import { ensureDir, writeJSON } from "./fsUtils";

import type { DeployShopResult } from "./deployTypes";

export interface ShopDeploymentAdapter {
  scaffold(appPath: string): void;
  deploy(id: string, domain?: string): DeployShopResult;
  writeDeployInfo(id: string, info: DeployShopResult): void;
}

export class CloudflareDeploymentAdapter implements ShopDeploymentAdapter {
  scaffold(appPath: string): void {
    const result = spawnSync("npx", ["--yes", "create-cloudflare", appPath], {
      stdio: "inherit",
    });

    if (result.status !== 0) {
      throw new Error("C3 process failed or not available. Skipping."); // i18n-exempt -- internal tooling error message
    }
  }

  deploy(id: string, domain?: string): DeployShopResult {
    const previewUrl = `https://${id}.pages.dev`;
    const instructions = domain
      ? `Add a CNAME record for ${domain} pointing to ${id}.pages.dev`
      : undefined;

    return {
      status: "success",
      previewUrl,
      instructions,
    };
  }

  writeDeployInfo(id: string, info: DeployShopResult): void {
    try {
      const dir = join("data", "shops", id);
      ensureDir(dir);
      const file = join(dir, "deploy.json");
      writeJSON(file, info);
    } catch {
      // ignore write errors
    }
  }
}

export const defaultDeploymentAdapter = new CloudflareDeploymentAdapter();
