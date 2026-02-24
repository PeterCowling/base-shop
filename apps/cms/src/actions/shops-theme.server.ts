"use server";

import type { Shop } from "@acme/types";

import {
  resetThemeOverride as serviceResetThemeOverride,
  updateShop as serviceUpdateShop,
} from "../services/shops/themeService";

export async function updateShop(
  shop: string,
  formData: FormData,
): Promise<{ shop?: Shop; errors?: Record<string, string[]> }> {
  return serviceUpdateShop(shop, formData);
}

export async function resetThemeOverride(shop: string, token: string) {
  return serviceResetThemeOverride(shop, token);
}
