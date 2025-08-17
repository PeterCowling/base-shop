// packages/platform-core/src/createShop/index.ts
import { readdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { validateShopName } from "../shops";
import {
  prepareOptions,
  createShopOptionsSchema as baseCreateShopOptionsSchema,
  type CreateShopOptions,
  type PreparedCreateShopOptions,
} from "./schema";
import { loadTokens } from "./themeUtils";
import type { DeployStatusBase, DeployShopResult } from "./deployTypes";
import {
  defaultDeploymentAdapter,
  type ShopDeploymentAdapter,
} from "./deploymentAdapter";
/**
 * Create a new shop app and seed data.
 * Paths are resolved relative to the repository root.
 */
export async function createShop(
  id: string,
  opts: CreateShopOptions = {} as CreateShopOptions,
  options?: { deploy?: boolean },
  adapter: ShopDeploymentAdapter = defaultDeploymentAdapter
): Promise<DeployStatusBase> {
  id = validateShopName(id);

  const prepared = prepareOptions(id, opts);

  const themeOverrides: Record<string, string> = prepared.themeOverrides;
  const themeDefaults = loadTokens(prepared.theme);
  const themeTokens = { ...themeDefaults, ...themeOverrides };

  const shopData = {
    id,
    name: prepared.name,
    catalogFilters: [],
    themeId: prepared.theme,
    themeDefaults,
    themeOverrides,
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
    enableEditorial: prepared.enableEditorial,
    subscriptionsEnabled: prepared.enableSubscriptions,
    rentalSubscriptions: [],
  };

  await prisma.shop.create({
    data: { id, data: shopData as Prisma.InputJsonValue },
  });

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

  return deployShop(id, undefined, adapter);
}

export function deployShop(
  id: string,
  domain?: string,
  adapter: ShopDeploymentAdapter = defaultDeploymentAdapter
): DeployShopResult {
  const newApp = join("apps", id);
  let status: DeployShopResult["status"] = "success";
  let error: string | undefined;

  try {
    adapter.scaffold(newApp);
  } catch (err) {
    status = "error";
    error = (err as Error).message;
  }

  const result = adapter.deploy(id, domain);

  if (status === "error") {
    result.status = "error";
    result.error = error;
  }

  adapter.writeDeployInfo(id, result);
  return result;
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

export const createShopOptionsSchema = baseCreateShopOptionsSchema.strict();
export { prepareOptions };
export type { CreateShopOptions, PreparedCreateShopOptions, NavItem } from "./schema";
export type { DeployStatusBase, DeployShopResult } from "./deployTypes";
export {
  ensureTemplateExists,
  copyTemplate,
  readFile,
  writeFile,
} from "./fsUtils";
export { loadTokens, loadBaseTokens } from "./themeUtils";
export {
  type ShopDeploymentAdapter,
  CloudflareDeploymentAdapter,
  defaultDeploymentAdapter,
} from "./deploymentAdapter";
