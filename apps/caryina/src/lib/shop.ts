import { getShopSkuBySlug, listShopSkus } from "@acme/platform-core/repositories/catalogSkus.server";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import type { Locale, SKU } from "@acme/types";

import shop from "../../shop.json";

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
