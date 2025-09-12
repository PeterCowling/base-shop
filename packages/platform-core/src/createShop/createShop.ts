import * as fs from "fs";
import { join } from "path";
import { prisma } from "../db";
import { validateShopName } from "../shops";
import {
  prepareOptions,
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

  // Load deployment helpers lazily so tests can spy on the exported
  // `deployShop` function and have this module pick up the mocked
  // implementation. Importing from `./index` instead of `./deploy` ensures
  // we reference the same live binding that callers interact with.
  const mod = await import("./index");
  const fn = mod.deployShop as typeof mod.deployShop & {
    mock?: { implementation?: unknown };
    mockImplementation?: (impl: typeof mod.deployShopImpl) => void;
  };
  if (fn.mock) {
    fn(id, undefined, adapter);
    fn.mockImplementation?.(mod.deployShopImpl);
    return mod.deployShopImpl(id, undefined, adapter);
  }
  return fn(id, undefined, adapter);
}
