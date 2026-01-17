import type { ShopSettings } from "@acme/types";
import { authorize, fetchSettings, persistSettings } from "./helpers";
import { recordMetric } from "@acme/platform-core/utils";
import {
  parseCurrencyTaxForm,
  parseDepositForm,
  parseLateFeeForm,
  parseReverseLogisticsForm,
  parseUpsReturnsForm,
  parsePremierDeliveryForm,
  parseAiCatalogForm,
  parseStockAlertForm,
} from "./validation";

export function getSettings(shop: string) {
  return fetchSettings(shop);
}

export async function setFreezeTranslations(shop: string, freeze: boolean) {
  await authorize();
  const current = await fetchSettings(shop);
  const updated: ShopSettings = { ...current, freezeTranslations: freeze };
  await persistSettings(shop, updated);
  recordMetric("cms_settings_save_total", {
    shopId: shop,
    service: "cms",
    status: "success",
  });
  return updated;
}

export async function updateCurrencyAndTax(
  shop: string,
  formData: FormData,
): Promise<{ settings?: ShopSettings; errors?: Record<string, string[]> }> {
  await authorize();
  const { data, errors } = parseCurrencyTaxForm(formData);
  if (!data) {
    return { errors };
  }
  const current = await fetchSettings(shop);
  const updated: ShopSettings = {
    ...current,
    currency: data.currency,
    taxRegion: data.taxRegion,
  };
  await persistSettings(shop, updated);
  recordMetric("cms_settings_save_total", {
    shopId: shop,
    service: "cms",
    status: "success",
  });
  return { settings: updated };
}

export async function updateDeposit(
  shop: string,
  formData: FormData,
): Promise<{ settings?: ShopSettings; errors?: Record<string, string[]> }> {
  await authorize();
  const { data, errors } = parseDepositForm(formData);
  if (!data) {
    return { errors };
  }
  const current = await fetchSettings(shop);
  const updated: ShopSettings = {
    ...current,
    depositService: {
      enabled: data.enabled,
      intervalMinutes: data.intervalMinutes,
    },
  };
  await persistSettings(shop, updated);
  recordMetric("cms_settings_save_total", {
    shopId: shop,
    service: "cms",
    status: "success",
  });
  return { settings: updated };
}

export async function updateLateFee(
  shop: string,
  formData: FormData,
): Promise<{ settings?: ShopSettings; errors?: Record<string, string[]> }> {
  await authorize();
  const { data, errors } = parseLateFeeForm(formData);
  if (!data) {
    return { errors };
  }
  const current = await fetchSettings(shop);
  const updated: ShopSettings = {
    ...current,
    lateFeeService: {
      enabled: data.enabled,
      intervalMinutes: data.intervalMinutes,
    },
  };
  await persistSettings(shop, updated);
  recordMetric("cms_settings_save_total", {
    shopId: shop,
    service: "cms",
    status: "success",
  });
  return { settings: updated };
}

export async function updateReverseLogistics(
  shop: string,
  formData: FormData,
): Promise<{ settings?: ShopSettings; errors?: Record<string, string[]> }> {
  await authorize();
  const { data, errors } = parseReverseLogisticsForm(formData);
  if (!data) {
    return { errors };
  }
  const current = await fetchSettings(shop);
  const updated: ShopSettings = {
    ...current,
    reverseLogisticsService: {
      enabled: data.enabled,
      intervalMinutes: data.intervalMinutes,
    },
  };
  await persistSettings(shop, updated);
  recordMetric("cms_settings_save_total", {
    shopId: shop,
    service: "cms",
    status: "success",
  });
  return { settings: updated };
}

export async function updateUpsReturns(
  shop: string,
  formData: FormData,
): Promise<{ settings?: ShopSettings; errors?: Record<string, string[]> }> {
  await authorize();
  const { data, errors } = parseUpsReturnsForm(formData);
  if (!data) {
    return { errors };
  }
  const current = await fetchSettings(shop);
  const updated: ShopSettings = {
    ...current,
    returnService: {
      upsEnabled: data.enabled,
      bagEnabled: data.bagEnabled ?? false,
      homePickupEnabled: data.homePickupEnabled ?? false,
    },
  };
  await persistSettings(shop, updated);
  recordMetric("cms_settings_save_total", {
    shopId: shop,
    service: "cms",
    status: "success",
  });
  return { settings: updated };
}

export async function updateStockAlert(
  shop: string,
  formData: FormData,
): Promise<{ settings?: ShopSettings; errors?: Record<string, string[]> }> {
  await authorize();
  const { data, errors } = parseStockAlertForm(formData);
  if (!data) {
    return { errors };
  }
  const current = await fetchSettings(shop);
  const updated: ShopSettings = {
    ...current,
    stockAlert: {
      recipients: data.recipients,
      webhook: data.webhook,
      threshold: data.threshold,
    },
  };
  await persistSettings(shop, updated);
  recordMetric("cms_settings_save_total", {
    shopId: shop,
    service: "cms",
    status: "success",
  });
  return { settings: updated };
}

export async function updatePremierDelivery(
  shop: string,
  formData: FormData,
): Promise<{ settings?: ShopSettings; errors?: Record<string, string[]> }> {
  await authorize();
  const { data, errors } = parsePremierDeliveryForm(formData);
  if (!data) {
    return { errors };
  }
  const current = await fetchSettings(shop);
  const updated: ShopSettings = {
    ...current,
    premierDelivery: {
      regions: data.regions,
      windows: data.windows,
      carriers: data.carriers,
      surcharge: data.surcharge,
      serviceLabel: data.serviceLabel,
    },
    luxuryFeatures: {
      ...(current.luxuryFeatures ?? {}),
      premierDelivery: true,
    },
  };
  await persistSettings(shop, updated);
  return { settings: updated };
}

export async function updateAiCatalog(
  shop: string,
  formData: FormData,
): Promise<{ settings?: ShopSettings; errors?: Record<string, string[]> }> {
  await authorize();
  const { data, errors } = parseAiCatalogForm(formData);
  if (!data) {
    return { errors };
  }
  const current = await fetchSettings(shop);
  const seo: ShopSettings["seo"] = { ...(current.seo ?? {}) };
  seo.aiCatalog = {
    enabled: data.enabled,
    fields: data.fields,
    pageSize: data.pageSize,
  };
  const updated: ShopSettings = { ...current, seo };
  await persistSettings(shop, updated);
  return { settings: updated };
}
