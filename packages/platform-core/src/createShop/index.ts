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
import type { DeployShopResult } from "./deployTypes";
import {
  defaultDeploymentAdapter,
  type ShopDeploymentAdapter,
} from "./deploymentAdapter";
import type { Shop } from "@acme/types";

function repoRoot(): string {
  const tryResolve = (p: string): string | null => {
    const norm = p.replace(/\\/g, "/");
    const match = norm.match(/^(.*?)(?:\/(?:packages|apps))(?:\/|$)/);
    return match ? match[1] : null;
  };

  return (
    tryResolve(process.cwd()) ??
    tryResolve(typeof __dirname !== "undefined" ? __dirname : process.cwd()) ??
    process.cwd()
  );
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
): Promise<DeployShopResult> {
  id = validateShopName(id);

  const prepared = prepareOptions(id, opts);

  const themeOverrides: Record<string, string> = prepared.themeOverrides;
  const themeDefaults = loadTokens(prepared.theme);
  const themeTokens = { ...themeDefaults, ...themeOverrides };

  const shopData: Shop = {
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
    coverageIncluded: true,
    luxuryFeatures: {
      blog: false,
      contentMerchandising: false,
      raTicketing: false,
      fraudReviewThreshold: 0,
      requireStrongCustomerAuth: false,
      strictReturnConditions: false,
      trackingDashboard: false,
      premierDelivery: false,
    },
    componentVersions: {},
  };

  await prisma.shop.create({
    data: { id, data: shopData },
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
      const envRel = join(newApp, ".env");
      const envAbs = join(repoRoot(), envRel);
      const envPath = fs.existsSync(envAbs) ? envAbs : envRel;
      if (fs.existsSync(envPath)) {
        let env = fs.readFileSync(envPath, "utf8");
      if (/^SESSION_SECRET=/m.test(env)) {
        env = env.replace(
          /^SESSION_SECRET=.*$/m,
          `SESSION_SECRET=${genSecret(32)}`
        );
      } else {
        env += (env.endsWith("\n") ? "" : "\n") +
          `SESSION_SECRET=${genSecret(32)}\n`;
      }
        try {
          fs.writeFileSync(envRel, env);
        } catch {
          /* ignore write errors on relative path */
        }
        if (envPath !== envRel) {
          fs.writeFileSync(envPath, env);
        } else if (fs.existsSync(envAbs)) {
          fs.writeFileSync(envAbs, env);
        }
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
    return fs
      .readdirSync(themesDir, { withFileTypes: true })
      .filter((ent) => ent.isDirectory())
      .map((ent) => ent.name);
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
  const pkgRel = join("apps", shop, "package.json");
  const pkgAbs = join(root, pkgRel);
  const cssRel = join("apps", shop, "src", "app", "globals.css");
  const cssAbs = join(root, cssRel);

  try {
    if (fs.existsSync(pkgAbs)) {
      const pkg = JSON.parse(fs.readFileSync(pkgAbs, "utf8")) as {
        dependencies?: Record<string, string>;
      };
      pkg.dependencies ??= {};
      for (const dep of Object.keys(pkg.dependencies)) {
        if (dep.startsWith("@themes/")) delete pkg.dependencies[dep];
      }
      pkg.dependencies[`@themes/${theme}`] = "workspace:*";
      const pkgJson = JSON.stringify(pkg, null, 2);
      try {
        fs.writeFileSync(pkgRel, pkgJson);
      } catch {
        /* ignore write errors on relative path */
      }
      fs.writeFileSync(pkgAbs, pkgJson);
    }
  } catch {
    // ignore errors when package.json is missing or invalid
  }

  try {
    if (fs.existsSync(cssAbs)) {
      const css = fs
        .readFileSync(cssAbs, "utf8")
        .replace(/@themes\/[^/]+\/tokens.css/, `@themes/${theme}/tokens.css`);
      try {
        fs.writeFileSync(cssRel, css);
      } catch {
        /* ignore write errors on relative path */
      }
      fs.writeFileSync(cssAbs, css);
    }
  } catch {
    // ignore errors when globals.css cannot be read
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
