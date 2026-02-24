"use server";

// apps/cms/src/actions/shops.server.ts

import type { ShopSettings } from "@acme/types";

import {
  getSettings as serviceGetSettings,
  setFreezeTranslations as serviceSetFreezeTranslations,
  updateAiCatalog as serviceUpdateAiCatalog,
  updateCurrencyAndTax as serviceUpdateCurrencyAndTax,
  updateDeposit as serviceUpdateDeposit,
  updateLateFee as serviceUpdateLateFee,
  updatePremierDelivery as serviceUpdatePremierDelivery,
  updateReverseLogistics as serviceUpdateReverseLogistics,
  updateStockAlert as serviceUpdateStockAlert,
  updateUpsReturns as serviceUpdateUpsReturns,
} from "../services/shops/settingsService";

export async function getSettings(shop: string): Promise<ShopSettings> {
  return serviceGetSettings(shop) as unknown as ShopSettings;
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

export async function updateLateFee(shop: string, formData: FormData) {
  return serviceUpdateLateFee(shop, formData);
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

export async function updatePremierDelivery(
  shop: string,
  formData: FormData,
) {
  return serviceUpdatePremierDelivery(shop, formData);
}

export async function updateAiCatalog(shop: string, formData: FormData) {
  return serviceUpdateAiCatalog(shop, formData);
}
