// packages/platform-core/repositories/json.server.ts
/**
 * Filesystem-backed JSON repositories — single barrel export.
 *
 * • readShop          – fetch shop metadata + theme tokens + nav
 * • getShopSettings   – CRUD helpers for settings.json
 * • products.server   – catalogue helpers (read/write/update/delete/…)
 */

export { readShop } from "./shops.server";

export * from "./products.server";

export {
  diffHistory,
  getShopSettings,
  saveShopSettings,
} from "./settings.server";
export type { SettingsDiffEntry } from "./settings.server";
