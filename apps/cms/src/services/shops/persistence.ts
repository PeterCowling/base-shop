import {
  getShopSettings,
  saveShopSettings,
  diffHistory,
} from "@platform-core/src/repositories/settings.server";
import {
  getShopById,
  updateShopInRepo,
} from "@platform-core/src/repositories/shop.server";
import {
  getStockAlertConfig,
  saveStockAlertConfig,
  type StockAlertConfig,
} from "@platform-core/src/repositories/stockAlerts.server";
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

export function fetchStockAlertConfig(shop: string) {
  return getStockAlertConfig(shop);
}

export function persistStockAlertConfig(
  shop: string,
  config: StockAlertConfig,
) {
  return saveStockAlertConfig(shop, config);
}
