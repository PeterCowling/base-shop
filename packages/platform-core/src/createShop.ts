// packages/platform-core/createShop.ts
import { spawnSync } from "child_process";
import { existsSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { validateShopName } from "./shops";
import {
  prepareOptions,
  type CreateShopOptions,
} from "./createShop/schema";
import {
  ensureTemplateExists,
  writeFiles,
} from "./createShop/fsUtils";
import { loadTokens } from "./createShop/themeUtils";

/**
 * Create a new shop app and seed data.
 * Paths are resolved relative to the repository root.
 */
export function createShop(
  id: string,
  opts: CreateShopOptions = {},
  { deploy = true }: { deploy?: boolean } = {}
): DeployStatusBase {
  id = validateShopName(id);
  const newApp = join("apps", id);
  const newData = join("data", "shops", id);

  if (existsSync(newApp)) {
    throw new Error(
      `App directory 'apps/${id}' already exists. Pick a different ID or remove the existing folder.`
    );
  }

  if (existsSync(newData)) {
    throw new Error(`Data for shop ${id} already exists`);
  }

  const options = prepareOptions(id, opts);
  const templateApp = ensureTemplateExists(options.theme, options.template);
  const themeTokens = loadTokens(options.theme);

  writeFiles(id, options, themeTokens, templateApp, newApp, newData);

  if (!deploy) {
    return { status: "pending" };
  }

  return deployShop(id);
}

export interface DeployStatusBase {
  status: "pending" | "success" | "error";
  previewUrl?: string;
  instructions?: string;
  error?: string;
}

export interface DeployShopResult extends DeployStatusBase {
  status: "success" | "error";
  previewUrl: string;
}

export function deployShop(id: string, domain?: string): DeployShopResult {
  const newApp = join("apps", id);
  const previewUrl = `https://${id}.pages.dev`;
  let status: DeployShopResult["status"] = "success";
  let error: string | undefined;

  try {
    const result = spawnSync("npx", ["--yes", "create-cloudflare", newApp], {
      stdio: "inherit",
    });
    if (result.status !== 0) {
      status = "error";
      error = "C3 process failed or not available. Skipping.";
    }
  } catch (err) {
    status = "error";
    error = (err as Error).message;
  }

  const instructions = domain
    ? `Add a CNAME record for ${domain} pointing to ${id}.pages.dev`
    : undefined;

  const resultObj: DeployShopResult = {
    status,
    previewUrl,
    instructions,
    error,
  };

  try {
    const file = join("data", "shops", id, "deploy.json");
    writeFileSync(file, JSON.stringify(resultObj, null, 2));
  } catch {
    // ignore write errors
  }
  return resultObj;
}

export function listThemes(): string[] {
  const themesDir = join("packages", "themes");
  return readdirSync(themesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export { prepareOptions } from "./createShop/schema";
export { ensureTemplateExists, writeFiles, copyTemplate } from "./createShop/fsUtils";
export { loadTokens, loadBaseTokens } from "./createShop/themeUtils";
