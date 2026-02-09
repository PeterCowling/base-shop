// packages/platform-core/repositories/json.server.ts
/**
 * Filesystem-backed JSON repositories — single barrel export.
 *
 * • readShop         – fetch shop metadata + theme tokens + nav
 * • readSettings     – fetch settings.json (alias of getShopSettings)
 * • getShopSettings  – underlying helper for settings.json
 * • saveShopSettings – write settings.json atomically
 * • diffHistory      – return patch history for settings.json
 * • products.server  – catalogue helpers (read/write/update/delete/…)
 *
 * The `readShop` helper pulls in a large dependency tree (including the
 * Prisma client) so we lazily import it.  This keeps simple JSON repo
 * consumers – such as unit tests that only touch product helpers – fast and
 * self-contained.
 */

import type { Shop } from "@acme/types";

export async function readShop(shop: string): Promise<Shop> {
  const mod = await import("./shops.server");
  return await mod.readShop(shop);
}

// Alias getShopSettings → readSettings so existing callers keep working.
export * from "./guides.server";
export * from "./inventory.server";
export * from "./pricing.server";
export * from "./products.server";
export * from "./returnLogistics.server";
export type { SettingsDiffEntry } from "./settings.server";
export { getShopSettings as readSettings } from "./settings.server";
export {
  diffHistory,
  getShopSettings,
  saveShopSettings,
} from "./settings.server";
export { getShopById, updateShopInRepo } from "./shop.server";
