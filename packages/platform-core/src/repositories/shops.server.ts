// packages/platform-core/repositories/shops.server.ts
import "server-only";

import { shopSchema, type Shop } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { prisma } from "../db";
import { defaultFilterMappings } from "../defaultFilterMappings";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";
import { baseTokens, loadThemeTokens } from "../themeTokens";
import { updateShopInRepo } from "./shop.server";
export {
  diffHistory,
  getShopSettings,
  saveShopSettings,
  type SettingsDiffEntry,
} from "./settings.server";

function shopPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "shop.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

async function applyThemeData(data: Shop): Promise<Shop> {
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
    // ignore DB errors and fall back to filesystem
  }
  try {
    const buf = await fs.readFile(shopPath(shop), "utf8");
    const parsed = shopSchema.safeParse(JSON.parse(buf));
    if (parsed.success && parsed.data.id) {
      return await applyThemeData(parsed.data as Shop);
    }
  } catch {
    // ignore
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
    luxuryFeatures: {
      contentMerchandising: false,
      raTicketing: false,
      fraudReviewThreshold: 0,
      requireStrongCustomerAuth: false,
      returns: false,
      strictReturnConditions: false,
    },
  };
  return await applyThemeData(empty);
}

export async function writeShop(
  shop: string,
  patch: Partial<Shop> & { id: string }
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
  const themeTokens = { ...themeDefaults, ...themeOverrides } as Record<string, string>;
  const updated = await updateShopInRepo<Shop>(shop, {
    ...patch,
    themeDefaults,
    themeOverrides,
    themeTokens,
  });
  return applyThemeData(updated);
}
