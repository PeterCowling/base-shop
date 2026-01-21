import {
  diffHistory,
  getShopSettings,
  saveShopSettings,
} from "@acme/platform-core/repositories/settings.server";
import {
  getShopById,
  updateShopInRepo,
} from "@acme/platform-core/repositories/shop.server";
import type { Shop, ShopSettings } from "@acme/types";

export function fetchShop(shop: string) {
  return getShopById<Shop>(shop);
}

export function persistShop(
  shop: string,
  patch: Partial<Shop> & { id: string }
) {
  return updateShopInRepo(shop, patch);
}

export function fetchSettings(shop: string) {
  return getShopSettings(shop);
}

export function persistSettings(shop: string, settings: ShopSettings) {
  return saveShopSettings(shop, settings);
}

export function fetchDiffHistory(shop: string) {
  return diffHistory(shop);
}
