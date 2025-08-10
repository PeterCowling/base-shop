// packages/platform-core/repositories/shops.server.ts
import "server-only";

import { shopSchema, type Shop } from "@types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { defaultFilterMappings } from "../defaultFilterMappings";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";
import { loadThemeTokens } from "../themeTokens";
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
    const buf = await fs.readFile(shopPath(shop), "utf8");
    const parsed = shopSchema.safeParse(JSON.parse(buf));
    if (parsed.success && parsed.data.id) {
      if (
        !parsed.data.themeTokens ||
        Object.keys(parsed.data.themeTokens).length === 0
      ) {
        parsed.data.themeTokens = await loadThemeTokens(parsed.data.themeId);
      }
      if (!parsed.data.navigation) parsed.data.navigation = [];
      return parsed.data as Shop;
    }
  } catch {
    // ignore
  }
  const themeId = "base";

  return {
    id: shop,
    name: shop,
    catalogFilters: [],
    themeId,
    themeTokens: await loadThemeTokens(themeId),
    filterMappings: { ...defaultFilterMappings },
    priceOverrides: {},
    localeOverrides: {},
    navigation: [],
    analyticsEnabled: false,
  };
}
