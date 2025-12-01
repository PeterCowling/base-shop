// packages/platform-core/repositories/shops.server.ts
import "server-only";

import type { Shop } from "@acme/types";
import { defaultFilterMappings } from "../defaultFilterMappings";
import { baseTokens, loadThemeTokens } from "../themeTokens/index";
import { prisma } from "../db";
import { getShopById, updateShopInRepo } from "./shop.server";
import { listShopsInDataRoot } from "../utils/safeFs";
export {
  diffHistory,
  getShopSettings,
  saveShopSettings,
  type SettingsDiffEntry,
} from "./settings.server";

export async function listShops(
  page = 1,
  limit = 50,
): Promise<string[]> {
  const pageNum = Math.max(1, Math.floor(page));
  const limitNum = Math.max(1, Math.floor(limit));
  try {
    const total = await prisma.shop.count();
    if (total === 0) return [];
    const maxPage = Math.max(1, Math.ceil(total / limitNum));
    const safePage = Math.min(pageNum, maxPage);
      const rows = (await prisma.shop.findMany({
        select: { id: true },
        orderBy: { id: "asc" },
        skip: (safePage - 1) * limitNum,
        take: limitNum,
      })) as Array<{ id: string }>;
      return rows.map((r: { id: string }) => r.id);
  } catch {
    try {
      const dirs = await listShopsInDataRoot();
      if (dirs.length === 0) return [];
      const maxPage = Math.max(1, Math.ceil(dirs.length / limitNum));
      const safePage = Math.min(pageNum, maxPage);
      const start = (safePage - 1) * limitNum;
      return dirs.slice(start, start + limitNum);
    } catch {
      return [];
    }
  }
}

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
    // If the repository cannot supply a shop (for example in tests or when the
    // backing store is empty), fall through to an in-memory default shape so
    // callers have a consistent object to work with.
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
