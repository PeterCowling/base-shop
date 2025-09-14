"use server";

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
  updateReverseLogistics as serviceUpdateReverseLogistics,
  updateUpsReturns as serviceUpdateUpsReturns,
  updatePremierDelivery as serviceUpdatePremierDelivery,
  updateAiCatalog as serviceUpdateAiCatalog,
  updateStockAlert as serviceUpdateStockAlert,
  updateStockScheduler as serviceUpdateStockScheduler,
  resetThemeOverride as serviceResetThemeOverride,
  type Shop,
  type ShopSettings,
} from "../services/shops";
import { getStockCheckHistory as serviceGetStockCheckHistory } from "@acme/platform-core/services/stockScheduler.server";

export async function updateShop(
  shop: string,
  formData: FormData,
): Promise<{ shop?: Shop; errors?: Record<string, string[]> }> {
  return serviceUpdateShop(shop, formData);
}

export async function getSettings(shop: string): Promise<ShopSettings> {
  return serviceGetSettings(shop);
}

export async function updateSeo(
  shop: string,
  formData: FormData,
) {
  return serviceUpdateSeo(shop, formData);
}

export async function generateSeo(
  shop: string,
  formData: FormData,
) {
  return serviceGenerateSeo(shop, formData);
}

export async function revertSeo(shop: string, timestamp: string) {
  return serviceRevertSeo(shop, timestamp);
}

export async function setFreezeTranslations(shop: string, freeze: boolean) {
  return serviceSetFreezeTranslations(shop, freeze);
}

export async function updateCurrencyAndTax(
  shop: string,
  formData: FormData,
) {
  return serviceUpdateCurrencyAndTax(shop, formData);
}

export async function updateDeposit(shop: string, formData: FormData) {
  return serviceUpdateDeposit(shop, formData);
}

export async function updateReverseLogistics(shop: string, formData: FormData) {
  return serviceUpdateReverseLogistics(shop, formData);
}

export async function updateUpsReturns(shop: string, formData: FormData) {
  return serviceUpdateUpsReturns(shop, formData);
}

export async function updateStockAlert(shop: string, formData: FormData) {
  return serviceUpdateStockAlert(shop, formData);
}

export async function updateStockScheduler(shop: string, formData: FormData) {
  return serviceUpdateStockScheduler(shop, formData);
}

export async function updatePremierDelivery(
  shop: string,
  formData: FormData,
) {
  return serviceUpdatePremierDelivery(shop, formData);
}

export async function updateAiCatalog(shop: string, formData: FormData) {
  return serviceUpdateAiCatalog(shop, formData);
}

export async function getStockCheckHistory(shop: string) {
  return serviceGetStockCheckHistory(shop);
}

export async function resetThemeOverride(shop: string, token: string) {
  return serviceResetThemeOverride(shop, token);
}

export type { Shop, ShopSettings };
