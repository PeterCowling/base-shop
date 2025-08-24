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

export { readShop } from "./dist/repositories/shops.server.js";

// Alias getShopSettings → readSettings so existing callers keep working.
export { getShopSettings as readSettings } from "./dist/repositories/settings.server.js";

export * from "./dist/repositories/products.server.js";
export * from "./dist/repositories/inventory.server.js";
export * from "./pricing.server.js";
export * from "./returnLogistics.server.js";

export {
  diffHistory,
  getShopSettings,
  saveShopSettings,
} from "./dist/repositories/settings.server.js";
export type { SettingsDiffEntry } from "./dist/repositories/settings.server.js";
export { getShopById, updateShopInRepo } from "./shop.server.js";
