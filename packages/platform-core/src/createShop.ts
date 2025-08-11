// packages/platform-core/createShop.ts
import { spawnSync } from "child_process";
import { readdirSync } from "fs";
import { join } from "path";
import { prisma } from "./db";
import { validateShopName } from "./shops";
import {
  prepareOptions,
  createShopOptionsSchema as baseCreateShopOptionsSchema,
  type CreateShopOptions,
  type PreparedCreateShopOptions,
} from "./createShop/schema";
import { loadTokens } from "./createShop/themeUtils";

/**
 * Create a new shop app and seed data.
 * Paths are resolved relative to the repository root.
 */
export async function createShop(
  id: string,
  opts: CreateShopOptions = {},
  options?: { deploy?: boolean }
): Promise<DeployStatusBase> {
  id = validateShopName(id);

  const prepared = prepareOptions(id, opts);
  const themeTokens = loadTokens(prepared.theme);

  const shopData = {
    id,
    name: prepared.name,
    catalogFilters: [],
    themeId: prepared.theme,
    themeOverrides: {},
    themeTokens,
    filterMappings: {},
    priceOverrides: {},
    localeOverrides: {},
    navigation: prepared.navItems,
    analyticsEnabled: prepared.analytics?.enabled ?? false,
    shippingProviders: prepared.shipping,
    taxProviders: [prepared.tax],
    paymentProviders: prepared.payment,
    sanityBlog: prepared.sanityBlog,
  };

  await prisma.shop.create({ data: { id, data: shopData } });

  if (prepared.pages.length) {
    await prisma.page.createMany({
      data: prepared.pages.map((p) => ({
        shopId: id,
        slug: p.slug,
        data: p,
      })),
    });
  }

  if (options?.deploy === false) {
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

/**
 * Update an existing shop to use a different theme.
 *
 * This adjusts the shop app's package dependency and global CSS token import.
 * It returns the default token map for the selected theme so callers can merge
 * in any overrides before persisting to the shop.json file.
 */
export function syncTheme(shop: string, theme: string): Record<string, string> {
  const appDir = join("apps", shop);
  const pkgPath = join(appDir, "package.json");
  const cssPath = join(appDir, "src", "app", "globals.css");

  try {
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
        dependencies?: Record<string, string>;
      };
      pkg.dependencies ??= {};
      for (const dep of Object.keys(pkg.dependencies)) {
        if (dep.startsWith("@themes/")) delete pkg.dependencies[dep];
      }
      pkg.dependencies[`@themes/${theme}`] = "workspace:*";
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }
  } catch {
    // ignore errors when package.json is missing or invalid
  }

  try {
    if (existsSync(cssPath)) {
      const css = readFileSync(cssPath, "utf8").replace(
        /@themes\/[^/]+\/tokens.css/,
        `@themes/${theme}/tokens.css`
      );
      writeFileSync(cssPath, css);
    }
  } catch {
    // ignore errors when globals.css cannot be read
  }

  return loadTokens(theme);
}

export const createShopOptionsSchema =
  baseCreateShopOptionsSchema.strict();
export { prepareOptions };
export type { CreateShopOptions, PreparedCreateShopOptions };
export { ensureTemplateExists, writeFiles, copyTemplate } from "./createShop/fsUtils";
export { loadTokens, loadBaseTokens } from "./createShop/themeUtils";
export { syncTheme };
