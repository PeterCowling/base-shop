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
 */

export { readShop } from "./shops.server";

// Alias getShopSettings → readSettings so existing callers keep working.
export { getShopSettings as readSettings } from "./settings.server";

export * from "./products.server";
export * from "./inventory.server";
export * from "./pricing.server";
export * from "./returnLogistics.server";

export {
  diffHistory,
  getShopSettings,
  saveShopSettings,
} from "./settings.server";
export type { SettingsDiffEntry } from "./settings.server";
export { getShopById, updateShopInRepo } from "./shop.server";
