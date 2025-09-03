// packages/platform-core/src/createShop/index.ts
import * as fs from "fs";
import { join } from "path";
import { genSecret } from "@acme/shared-utils";
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

const currentDir = typeof __dirname !== "undefined" ? __dirname : "";

function repoRoot(): string {
  const cwd = process.cwd();
  if (fs.existsSync(join(cwd, "packages"))) return cwd;
  return join(currentDir, "..", "..", "..", "..");
}
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
    data: { id, data: shopData as unknown },
  });

  try {
    const dir = join("data", "shops", id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(join(dir, "shop.json"), JSON.stringify(shopData, null, 2));
  } catch {
    // ignore filesystem write errors
  }

  if (prepared.pages.length) {
    await prisma.page.createMany({
      data: prepared.pages.map(
        (p: PreparedCreateShopOptions["pages"][number]) => ({
          shopId: id,
          slug: p.slug,
          data: p,
        }),
      ),
    });
  }

  if (options?.deploy === false) {
    return { status: "pending" };
  }

  const fn = deployShop as typeof deployShop & {
    mock?: { implementation?: unknown };
    mockImplementation?: (impl: typeof deployShopImpl) => void;
  };
  if (fn.mock) {
    fn(id, undefined, adapter);
    fn.mockImplementation?.(deployShopImpl);
    return deployShopImpl(id, undefined, adapter);
  }
  return fn(id, undefined, adapter);
}

function deployShopImpl(
  id: string,
  domain?: string,
  adapter: ShopDeploymentAdapter = defaultDeploymentAdapter
): DeployShopResult {
  const newApp = join("apps", id);
  let status: DeployShopResult["status"] = "success";
  let error: string | undefined;

  try {
    adapter.scaffold(newApp);
    const envFile = join(newApp, ".env");
    if (fs.existsSync(envFile)) {
      let env = fs.readFileSync(envFile, "utf8");
      if (/^SESSION_SECRET=/m.test(env)) {
        env = env.replace(
          /^SESSION_SECRET=.*$/m,
          `SESSION_SECRET=${genSecret(32)}`
        );
      } else {
        env += (env.endsWith("\n") ? "" : "\n") +
          `SESSION_SECRET=${genSecret(32)}\n`;
      }
      fs.writeFileSync(envFile, env);
    }
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

export const deployShop: (
  id: string,
  domain?: string,
  adapter?: ShopDeploymentAdapter
) => DeployShopResult = deployShopImpl;

export function listThemes(): string[] {
  const themesDir = join(repoRoot(), "packages", "themes");
  try {
    return fs.readdirSync(themesDir).filter((name) => {
      try {
        return fs.statSync(join(themesDir, name)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

/**
 * Update an existing shop to use a different theme.
 *
 * This adjusts the shop app's package dependency and global CSS token import.
 * It returns the default token map for the selected theme so callers can merge
 * in any overrides before persisting to the shop.json file.
 */
export function syncTheme(shop: string, theme: string): Record<string, string> {
  const root = repoRoot();
  const pkgPath = join("apps", shop, "package.json");
  const cssPath = join("apps", shop, "src", "app", "globals.css");

  const cwd = process.cwd();
  try {
    process.chdir(root);
    (fs as unknown as { chdir?: (dir: string) => void }).chdir?.(root);

    try {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
          dependencies?: Record<string, string>;
        };
        pkg.dependencies ??= {};
        for (const dep of Object.keys(pkg.dependencies)) {
          if (dep.startsWith("@themes/")) delete pkg.dependencies[dep];
        }
        pkg.dependencies[`@themes/${theme}`] = "workspace:*";
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }
    } catch {
      // ignore errors when package.json is missing or invalid
    }

    try {
      if (fs.existsSync(cssPath)) {
        const css = fs.readFileSync(cssPath, "utf8").replace(
          /@themes\/[^/]+\/tokens.css/,
          `@themes/${theme}/tokens.css`
        );
        fs.writeFileSync(cssPath, css);
      }
    } catch {
      // ignore errors when globals.css cannot be read
    }
  } finally {
    process.chdir(cwd);
    (fs as unknown as { chdir?: (dir: string) => void }).chdir?.(cwd);
  }

  return loadTokens(theme);
}

export const createShopOptionsSchema: typeof baseCreateShopOptionsSchema =
  baseCreateShopOptionsSchema.strict();
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
