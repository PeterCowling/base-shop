// scripts/src/launch-shop/steps/scaffold.ts
/**
 * Scaffold step: invoke init-shop to create the shop structure.
 */
import { spawnSync } from "node:child_process";
import { existsSync, rmSync,unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { LaunchConfig } from "@acme/platform-core/createShop";
import { getShopAppSlug } from "@acme/platform-core/shops";

import { LaunchError } from "../types";

export interface ScaffoldOptions {
  envFilePath?: string;
  vaultCmd?: string;
  force: boolean;
}

/**
 * Run the scaffold step by invoking init-shop.
 */
export function runScaffold(
  config: LaunchConfig,
  options: ScaffoldOptions,
  workDir: string = process.cwd()
): void {
  const appSlug = getShopAppSlug(config.shopId);
  const appDir = join(workDir, "apps", appSlug);

  // If --force, remove existing shop directory
  if (options.force && existsSync(appDir)) {
    console.log(`Removing existing shop directory: ${appDir}`);
    rmSync(appDir, { recursive: true, force: true });
  }

  // Write temp config file for init-shop (extract shop creation options only)
  const tempConfigPath = join(workDir, ".launch-temp-config.json");
  const initShopConfig = {
    id: config.shopId,
    name: config.name,
    type: config.type,
    theme: config.theme,
    template: config.template,
    payment: config.payment,
    shipping: config.shipping,
    navItems: config.navItems,
    pages: config.pages,
    themeOverrides: config.themeOverrides,
    analytics: config.analytics,
    sanityBlog: config.sanityBlog,
    enableEditorial: config.enableEditorial,
    enableSubscriptions: config.enableSubscriptions,
    // Don't include setupCI - we handle CI setup separately
  };

  writeFileSync(tempConfigPath, JSON.stringify(initShopConfig, null, 2));

  try {
    const args = [
      "init-shop",
      "--skip-prompts",
      "--config",
      tempConfigPath,
      "--seed-full",
    ];

    if (options.envFilePath) {
      args.push("--env-file", options.envFilePath);
    }
    if (options.vaultCmd) {
      args.push("--vault-cmd", options.vaultCmd);
    }

    console.log(`Running init-shop for ${config.shopId}...`);

    const result = spawnSync("pnpm", args, {
      cwd: workDir,
      stdio: "inherit",
      encoding: "utf8",
    });

    if (result.status !== 0) {
      throw new LaunchError(
        `init-shop failed with exit code ${result.status}`,
        "scaffold",
        true
      );
    }

    console.log(`Shop scaffolded successfully: apps/${appSlug}`);
  } finally {
    // Cleanup temp config
    if (existsSync(tempConfigPath)) {
      unlinkSync(tempConfigPath);
    }
  }
}
