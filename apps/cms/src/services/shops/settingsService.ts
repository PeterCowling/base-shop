import type { Locale, Shop, ShopSettings } from "@acme/types";
import { authorize } from "./authorization";
import {
  parseShopForm,
  parseCurrencyTaxForm,
  parseDepositForm,
  parseUpsReturnsForm,
  parsePremierDeliveryForm,
  parseAiCatalogForm,
} from "./validation";
import {
  buildThemeData,
} from "./theme";
import {
  fetchShop,
  persistShop,
  fetchSettings,
  persistSettings,
} from "./persistence";

export async function updateShop(
  shop: string,
  formData: FormData,
): Promise<{ shop?: Shop; errors?: Record<string, string[]> }> {
  await authorize();
  const current = await fetchShop(shop);
  const { data, errors } = parseShopForm(formData);
  if (!data) {
    console.error(`[updateShop] validation failed for shop ${shop}`, errors);
    return { errors };
  }
  if (current.id !== data.id) throw new Error(`Shop ${data.id} not found in ${shop}`);

  const theme = await buildThemeData(shop, data, current);

  const patch: Partial<Shop> & { id: string } = {
    id: current.id,
    name: data.name,
    themeId: data.themeId,
    catalogFilters: data.catalogFilters,
    enableEditorial: data.enableEditorial,
    themeDefaults: theme.themeDefaults,
    themeOverrides: theme.overrides,
    themeTokens: theme.themeTokens,
    filterMappings: data.filterMappings as Record<string, string>,
    priceOverrides: data.priceOverrides as Partial<Record<Locale, number>>,
    localeOverrides: data.localeOverrides as Record<string, Locale>,
    luxuryFeatures: data.luxuryFeatures,
  };

  const saved = await persistShop(shop, patch);

  const settings = await fetchSettings(shop);
  const updatedSettings: ShopSettings = {
    ...settings,
    trackingProviders: data.trackingProviders,
    luxuryFeatures: data.luxuryFeatures,
  };
  await persistSettings(shop, updatedSettings);

  return { shop: saved };
}

export function getSettings(shop: string) {
  return fetchSettings(shop);
}

export async function setFreezeTranslations(shop: string, freeze: boolean) {
  await authorize();
  const current = await fetchSettings(shop);
  const updated: ShopSettings = { ...current, freezeTranslations: freeze };
  await persistSettings(shop, updated);
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
  return { settings: updated };
}

export async function updateDepositService(
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
    returnService: { upsEnabled: data.enabled },
  };
  await persistSettings(shop, updated);
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
    premierDelivery: data,
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
  const seo = { ...(current.seo ?? {}) };
  (seo as any).aiCatalog = {
    enabled: data.enabled,
    fields: data.fields,
    pageSize: data.pageSize,
  };
  const updated: ShopSettings = { ...current, seo };
  await persistSettings(shop, updated);
  return { settings: updated };
}

export type { Shop, ShopSettings };
