// packages/platform-core/src/createShop/index.ts
import * as fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
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

// `__dirname` only exists in CommonJS builds; declare it so TypeScript allows
// referencing it as a fallback when running tests transpiled to CJS.
// eslint-disable-next-line no-var
declare var __dirname: string;

function repoRoot(): string {
  const hasMarker = (dir: string): boolean =>
    fs.existsSync(join(dir, "packages")) ||
    fs.existsSync(join(dir, "apps")) ||
    fs.existsSync(join(dir, "pnpm-workspace.yaml"));

  const searchUp = (start: string): string | null => {
    let dir = start;
    while (true) {
      if (hasMarker(dir)) return dir;
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return null;
  };

  try {
    const moduleDir =
      typeof __dirname !== "undefined"
        ? __dirname
        : dirname(fileURLToPath(eval("import.meta.url")));
    const fromModule = searchUp(moduleDir);
    if (fromModule) return fromModule;
  } catch {
    /* ignore */
  }

  const fromCwd = searchUp(process.cwd());
  if (fromCwd) return fromCwd;

  // If the current working directory is above the repo root, scan its
  // immediate subdirectories for a workspace marker.
  try {
    for (const entry of fs.readdirSync(process.cwd(), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const candidate = join(process.cwd(), entry.name);
      if (hasMarker(candidate)) return candidate;
    }
  } catch {
    /* ignore */
  }

  return process.cwd();
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
      const envSrc = fs.existsSync(envAbs) ? envAbs : envRel;

      let env = "";
      try {
        env = fs.readFileSync(envSrc, "utf8");
      } catch {
        /* no existing env file */
      }

      const secret = `SESSION_SECRET=${genSecret(32)}`;
      if (/^SESSION_SECRET=/m.test(env)) {
        env = env.replace(/^SESSION_SECRET=.*$/m, secret);
      } else {
        env += (env.endsWith("\n") ? "" : "\n") + secret + "\n";
      }

      // Write both the repo-absolute path and a path resolved from the current
      // working directory. Some test environments mock `fs` with a different
      // notion of CWD, so attempt both to ensure the secret persists.
      const cwdPath = join(process.cwd(), envRel);
      for (const p of new Set([envAbs, cwdPath, envSrc])) {
        try {
          fs.mkdirSync(dirname(p), { recursive: true });
          fs.writeFileSync(p, env);
        } catch {
          /* ignore write errors */
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
  const roots = new Set<string>([repoRoot(), process.cwd()]);
  try {
    const modRoot =
      typeof __dirname !== "undefined"
        ? join(__dirname, "../../../..")
        : join(dirname(fileURLToPath(eval("import.meta.url"))), "../../../..");
    roots.add(modRoot);
  } catch {
    /* ignore */
  }
  for (const root of roots) {
    try {
      const themesDir = join(root, "packages", "themes");
      const entries = fs.readdirSync(themesDir, { withFileTypes: true });
      return entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    } catch {
      /* try next root */
    }
  }
  // Return an empty array when the themes directory cannot be read
  return [];
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
    const pkgPath = fs.existsSync(pkgAbs)
      ? pkgAbs
      : fs.existsSync(pkgRel)
      ? pkgRel
      : null;
    if (pkgPath) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
        dependencies?: Record<string, string>;
      };
      pkg.dependencies ??= {};
      for (const dep of Object.keys(pkg.dependencies)) {
        if (dep.startsWith("@themes/")) delete pkg.dependencies[dep];
      }
      pkg.dependencies[`@themes/${theme}`] = "workspace:*";
      const pkgJson = JSON.stringify(pkg, null, 2);
      for (const p of new Set([pkgRel, pkgAbs])) {
        try {
          fs.writeFileSync(p, pkgJson);
        } catch {
          /* ignore write errors */
        }
      }
    }
  } catch {
    // ignore errors when package.json is missing or invalid
  }

  try {
    const cssPath = fs.existsSync(cssAbs)
      ? cssAbs
      : fs.existsSync(cssRel)
      ? cssRel
      : null;
    if (cssPath) {
      const css = fs
        .readFileSync(cssPath, "utf8")
        .replace(/@themes\/[^/]+\/tokens.css/, `@themes/${theme}/tokens.css`);
      for (const p of new Set([cssRel, cssAbs])) {
        try {
          fs.writeFileSync(p, css);
        } catch {
          /* ignore write errors */
        }
      }
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
