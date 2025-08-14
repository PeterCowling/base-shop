// apps/cms/src/actions/shops.server.ts

import {
  updateShop as serviceUpdateShop,
  getSettings as serviceGetSettings,
  updateSeo as serviceUpdateSeo,
  generateSeo as serviceGenerateSeo,
  revertSeo as serviceRevertSeo,
  setFreezeTranslations as serviceSetFreezeTranslations,
  updateCurrencyAndTax as serviceUpdateCurrencyAndTax,
  updateDeposit as serviceUpdateDeposit,
  updateStockAlerts as serviceUpdateStockAlerts,
  updateUpsReturns as serviceUpdateUpsReturns,
  updatePremierDelivery as serviceUpdatePremierDelivery,
  updateAiCatalog as serviceUpdateAiCatalog,
  resetThemeOverride as serviceResetThemeOverride,
  type Shop,
  type ShopSettings,
} from "../services/shops";

export async function updateShop(
  shop: string,
  formData: FormData,
): Promise<{ shop?: Shop; errors?: Record<string, string[]> }> {
  "use server";
  return serviceUpdateShop(shop, formData);
}

export function getSettings(shop: string) {
  return serviceGetSettings(shop);
}

export async function updateSeo(
  shop: string,
  formData: FormData,
) {
  "use server";
  return serviceUpdateSeo(shop, formData);
}

export async function generateSeo(
  shop: string,
  formData: FormData,
) {
  "use server";
  return serviceGenerateSeo(shop, formData);
}

export async function revertSeo(shop: string, timestamp: string) {
  "use server";
  return serviceRevertSeo(shop, timestamp);
}

export async function setFreezeTranslations(shop: string, freeze: boolean) {
  "use server";
  return serviceSetFreezeTranslations(shop, freeze);
}

export async function updateCurrencyAndTax(
  shop: string,
  formData: FormData,
) {
  "use server";
  return serviceUpdateCurrencyAndTax(shop, formData);
}

export async function updateDeposit(shop: string, formData: FormData) {
  "use server";
  return serviceUpdateDeposit(shop, formData);
}

export async function updateStockAlerts(shop: string, formData: FormData) {
  "use server";
  return serviceUpdateStockAlerts(shop, formData);
}

export async function updateUpsReturns(shop: string, formData: FormData) {
  "use server";
  return serviceUpdateUpsReturns(shop, formData);
}

export async function updatePremierDelivery(
  shop: string,
  formData: FormData,
) {
  "use server";
  return serviceUpdatePremierDelivery(shop, formData);
}

export async function updateAiCatalog(shop: string, formData: FormData) {
  "use server";
  return serviceUpdateAiCatalog(shop, formData);
}

export async function resetThemeOverride(shop: string, token: string) {
  "use server";
  return serviceResetThemeOverride(shop, token);
}

export type { Shop, ShopSettings };
