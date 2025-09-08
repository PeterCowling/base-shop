// packages/platform-core/src/repositories/shops.prisma.server.ts
import "server-only";

import { shopSchema, type Shop } from "@acme/types";
import { prisma } from "../db";
import { defaultFilterMappings } from "../defaultFilterMappings";
import { baseTokens, loadThemeTokens } from "../themeTokens/index";
import { updateShopInRepo } from "./shop.prisma.server";

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
    const rec = await prisma.shop.findUnique({ where: { id: shop } });
    if (rec) {
      const data = shopSchema.parse(rec.data);
      return await applyThemeData(data as Shop);
    }
  } catch {
    // ignore and fall back to defaults
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
  patch: Partial<Shop> & { id: string },
): Promise<Shop> {
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
  const themeTokens = {
    ...themeDefaults,
    ...themeOverrides,
  } as Record<string, string>;
  const updated = await updateShopInRepo<Shop>(shop, {
    ...patch,
    id: patch.id,
    themeDefaults,
    themeOverrides,
    themeTokens,
  });
  return applyThemeData(updated);
}

