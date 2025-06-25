"use server";

import {
  getShopById,
  updateShopInRepo,
} from "@platform-core/repositories/json";
import type { Shop } from "@types";

export async function updateShop(
  shop: string,
  formData: FormData
): Promise<Shop> {
  const id = String(formData.get("id"));
  const current = await getShopById(shop);
  if (current.id !== id) throw new Error(`Shop ${id} not found in ${shop}`);

  const updated: Shop = {
    ...current,
    name: String(formData.get("name") ?? current.name),
    themeId: String(formData.get("themeId") ?? current.themeId),
    catalogFilters: String(formData.get("catalogFilters") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };

  return updateShopInRepo(shop, updated);
}
