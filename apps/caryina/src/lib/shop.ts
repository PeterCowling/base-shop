import { getShopSkuBySlug, listShopSkus } from "@acme/platform-core/repositories/catalogSkus.server";
import { readInventory } from "@acme/platform-core/repositories/inventory.server";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import type { InventoryItem, Locale, SKU } from "@acme/types";

import shop from "../../shop.json";

import {
  type LaunchCatalogMediaValidationResult,
  type LaunchSkuMediaValidationResult,
  validateLaunchCatalogMedia,
  validateLaunchSkuMedia,
} from "./launchMediaContract";

export const SHOP_ID = shop.id;

export async function readShopSkus(locale: Locale): Promise<SKU[]> {
  try {
    return await listShopSkus(SHOP_ID, locale, { includeDraft: false });
  } catch {
    return [];
  }
}

export async function readShopSkuBySlug(
  locale: Locale,
  slug: string,
): Promise<SKU | null> {
  try {
    return await getShopSkuBySlug(SHOP_ID, slug, locale, { includeDraft: false });
  } catch {
    return null;
  }
}

export async function readShopInventory(): Promise<InventoryItem[]> {
  try {
    const items = await readInventory(SHOP_ID);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export async function readShopCurrency(): Promise<string> {
  try {
    const settings = await getShopSettings(SHOP_ID);
    return settings.currency ?? "EUR";
  } catch {
    return "EUR";
  }
}

export function formatMoney(minorAmount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(minorAmount / 100);
  } catch {
    return `${(minorAmount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function validateLaunchSkuMediaContract(
  sku: Pick<SKU, "id" | "slug" | "media">,
): LaunchSkuMediaValidationResult {
  return validateLaunchSkuMedia(sku);
}

export function validateLaunchCatalogMediaContract(
  skus: ReadonlyArray<Pick<SKU, "id" | "slug" | "media">>,
): LaunchCatalogMediaValidationResult {
  return validateLaunchCatalogMedia(skus);
}
