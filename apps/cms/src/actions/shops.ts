// apps/cms/src/actions/shops.ts

"use server";

import {
  getShopById,
  updateShopInRepo,
} from "@platform-core/repositories/json";
import type { Shop } from "@types";
import { shopSchema, type ShopForm } from "./schemas";

export async function updateShop(
  shop: string,
  formData: FormData
): Promise<{ shop?: Shop; errors?: Record<string, string[]> }> {
  const id = String(formData.get("id"));
  const current = await getShopById(shop);
  if (current.id !== id) throw new Error(`Shop ${id} not found in ${shop}`);

  const parsed = shopSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data: ShopForm = parsed.data;

  const updated: Shop = {
    ...current,
    name: data.name,
    themeId: data.themeId,
    catalogFilters: data.catalogFilters,
    themeTokens: data.themeTokens,
    filterMappings: data.filterMappings,
  };

  const saved = await updateShopInRepo(shop, updated);
  return { shop: saved };
}
