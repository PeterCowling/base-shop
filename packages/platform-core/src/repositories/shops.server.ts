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

export async function readShop(shop: string): Promise<Shop> {
  try {
    const rec = await prisma.shop.findUnique({ where: { id: shop } });
    if (rec) {
      const data = shopSchema.parse(rec.data);
      const defaults = {
        ...baseTokens,
        ...(await loadThemeTokens(data.themeId)),
      };
      data.themeTokens = {
        ...defaults,
        ...data.themeOverrides,
      };
      if (!data.navigation) data.navigation = [];
      return data as Shop;
    }
  } catch {
    // ignore DB errors and fall back to filesystem
  }
  try {
    const buf = await fs.readFile(shopPath(shop), "utf8");
    const parsed = shopSchema.safeParse(JSON.parse(buf));
    if (parsed.success && parsed.data.id) {
      const defaults = {
        ...baseTokens,
        ...(await loadThemeTokens(parsed.data.themeId)),
      };
      parsed.data.themeTokens = {
        ...defaults,
        ...parsed.data.themeOverrides,
      };
      if (!parsed.data.navigation) parsed.data.navigation = [];
      return parsed.data as Shop;
    }
  } catch {
    // ignore
  }
  const themeId = "base";
  const themeTokens = {
    ...baseTokens,
    ...(await loadThemeTokens(themeId)),
  };

  return {
    id: shop,
    name: shop,
    catalogFilters: [],
    themeId,
    themeOverrides: {},
    themeTokens,
    filterMappings: { ...defaultFilterMappings },
    priceOverrides: {},
    localeOverrides: {},
    navigation: [],
    analyticsEnabled: false,
  };
}
