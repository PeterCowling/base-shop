// packages/platform-core/repositories/shops.server.ts
import "server-only";

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { Shop } from "../../types/src";
import { defaultFilterMappings } from "../defaultFilterMappings";
import { validateShopName } from "../shops";
import { DATA_ROOT, loadThemeTokens } from "./utils";

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
    const parsed = JSON.parse(buf) as Shop;
    if (parsed.id) {
      if (!parsed.themeTokens || Object.keys(parsed.themeTokens).length === 0) {
        parsed.themeTokens = await loadThemeTokens(parsed.themeId);
      }
      if (!parsed.navigation) parsed.navigation = [];
      return parsed;
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
  };
}

export async function saveShopSettings(
  shop: string,
  settings: ShopSettings
): Promise<void> {
  await ensureDir(shop);
  const current = await getShopSettings(shop);
  const tmp = `${settingsPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(settings, null, 2), "utf8");
  await fs.rename(tmp, settingsPath(shop));

  const patch = diffSettings(current, settings);
  if (Object.keys(patch).length > 0) {
    const entry = { timestamp: new Date().toISOString(), diff: patch };
    await fs.appendFile(
      historyPath(shop),
      JSON.stringify(entry) + "\n",
      "utf8"
    );
  }
}

export interface SettingsDiffEntry {
  timestamp: string;
  diff: Partial<ShopSettings>;
}

export async function diffHistory(shop: string): Promise<SettingsDiffEntry[]> {
  try {
    const buf = await fs.readFile(historyPath(shop), "utf8");
    return buf
      .trim()
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as SettingsDiffEntry);
  } catch {
    return [];
  }
}
