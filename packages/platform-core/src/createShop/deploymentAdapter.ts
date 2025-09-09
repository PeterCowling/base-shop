// packages/platform-core/src/createShop/deploymentAdapter.ts

import { spawnSync } from "child_process";
import { join } from "path";
import { writeFileSync, mkdirSync } from "node:fs";

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
      throw new Error("C3 process failed or not available. Skipping.");
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
      mkdirSync(dir, { recursive: true });
      const file = join(dir, "deploy.json");
      writeFileSync(file, JSON.stringify(info, null, 2));
    } catch {
      // ignore write errors
    }
  }
}

export const defaultDeploymentAdapter = new CloudflareDeploymentAdapter();

