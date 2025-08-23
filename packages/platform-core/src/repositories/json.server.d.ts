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
export { readShop } from "./shops.server.js";
export { getShopSettings as readSettings } from "./settings.server.js";
export * from "./products.server.js";
export * from "./inventory.server.js";
export * from "./pricing.server.js";
export * from "./returnLogistics.server.js";
export { diffHistory, getShopSettings, saveShopSettings, } from "./settings.server.js";
export type { SettingsDiffEntry } from "./settings.server.js";
export { getShopById, updateShopInRepo } from "./shop.server.js";
