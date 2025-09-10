// packages/platform-core/repositories/shops.server.ts
import "server-only";

import { promises as fs } from "fs";
import { shopSchema, type Shop } from "@acme/types";
import { defaultFilterMappings } from "../defaultFilterMappings";
import { DATA_ROOT } from "../dataRoot";
import { baseTokens, loadThemeTokens } from "../themeTokens/index";
import { prisma } from "../db";
import { getShopById, updateShopInRepo } from "./shop.server";
export {
  diffHistory,
  getShopSettings,
  saveShopSettings,
  type SettingsDiffEntry,
} from "./settings.server";

export async function applyThemeData(data: Shop): Promise<Shop> {
  const defaults =
    Object.keys(data.themeDefaults ?? {}).length > 0
      ? data.themeDefaults!
      : {
          ...baseTokens,
          ...(await loadThemeTokens(data.themeId)),
        };
  const overrides = data.themeOverrides ?? {};
  return {
    ...data,
    themeDefaults: defaults,
    themeOverrides: overrides,
    themeTokens: { ...defaults, ...overrides },
    navigation: data.navigation ?? [],
  } as Shop;
}

export async function readShop(shop: string): Promise<Shop> {
  try {
    const data = await getShopById<Shop>(shop);
    return await applyThemeData(data);
  } catch {
    // ignore and fall through
  }

  // When the resolved repository does not contain the shop (e.g. the JSON
  // backend is selected but the file is missing), attempt to read directly from
  // the Prisma stub.  This mirrors the behaviour expected in tests where
  // `prisma.shop.findUnique` is mocked.
  try {
    const rec = await prisma.shop.findUnique({ where: { id: shop } });
    const parsed = rec && shopSchema.safeParse(rec.data);
    if (parsed?.success) {
      return await applyThemeData(parsed.data as Shop);
    }
  } catch {
    // ignore and fall through
  }

  try {
    const raw = await fs.readFile(`${DATA_ROOT}/${shop}/shop.json`, "utf8");
    const parsed = shopSchema.safeParse(JSON.parse(raw));
    if (parsed.success) {
      return await applyThemeData(parsed.data as Shop);
    }
  } catch {
    // ignore and fall through
  }

  const themeId = "base";
  const empty: Shop = {
    id: shop,
    name: shop,
    catalogFilters: [],
    themeId,
    themeDefaults: {},
    themeOverrides: {},
    themeTokens: {},
    filterMappings: { ...defaultFilterMappings },
    priceOverrides: {},
    localeOverrides: {},
    navigation: [],
    analyticsEnabled: false,
    coverageIncluded: true,
    componentVersions: {},
    rentalSubscriptions: [],
    subscriptionsEnabled: false,
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
  };
  return await applyThemeData(empty);
}

export async function writeShop(
  shop: string,
  patch: Partial<Shop> & { id: string }
): Promise<Shop> {
  const { readShop } = await import("./shops.server");
  const current = await readShop(shop);
  const themeDefaults = {
    ...(current.themeDefaults ?? {}),
    ...(patch.themeDefaults ?? {}),
  } as Record<string, string>;
  const themeOverrides = {
    ...(current.themeOverrides ?? {}),
    ...(patch.themeOverrides ?? {}),
  } as Record<string, string>;
  for (const [k, v] of Object.entries(themeOverrides)) {
    if (v == null || v === themeDefaults[k]) delete themeOverrides[k];
  }
  const themeTokens = { ...themeDefaults, ...themeOverrides } as Record<string, string>;
  const updated = await updateShopInRepo<Shop>(shop, {
    ...patch,
    id: patch.id,
    themeDefaults,
    themeOverrides,
    themeTokens,
  });
  return applyThemeData(updated);
}
