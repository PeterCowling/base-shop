// apps/cms/src/services/shops.ts

import { revalidatePath } from "next/cache";
import type {
  Locale,
  Shop,
  ShopSeoFields,
  ShopSettings,
} from "@acme/types";
import { authorize } from "./shops/authorization";
import {
  parseShopForm,
  parseSeoForm,
  parseGenerateSeoForm,
  parseCurrencyTaxForm,
  parseDepositForm,
  parseUpsReturnsForm,
  parsePremierDeliveryForm,
  parseAiCatalogForm,
} from "./shops/validation";
import { buildThemeData, removeThemeToken } from "./shops/theme";
import {
  fetchShop,
  persistShop,
  fetchSettings,
  persistSettings,
  fetchDiffHistory,
} from "./shops/persistence";

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

export async function updateSeo(
  shop: string,
  formData: FormData,
): Promise<{
  settings?: unknown;
  errors?: Record<string, string[]>;
  warnings?: string[];
}> {
  await authorize();
  const { data, errors } = parseSeoForm(formData);
  if (!data) {
    console.error(`[updateSeo] validation failed for shop ${shop}`, errors);
    return { errors };
  }

  const {
    locale,
    title,
    description,
    image,
    alt,
    canonicalBase,
    ogUrl,
    twitterCard,
  } = data;

  const warnings: string[] = [];
  if (title.length > 70) warnings.push("Title exceeds 70 characters");
  if (description.length > 160)
    warnings.push("Description exceeds 160 characters");

  const current = await fetchSettings(shop);
  const seo = { ...(current.seo ?? {}) } as Record<Locale, ShopSeoFields>;
  seo[locale] = {
    title,
    description,
    image,
    alt,
    canonicalBase,
    openGraph: ogUrl ? { url: ogUrl } : undefined,
    twitter: twitterCard ? { card: twitterCard } : undefined,
  };
  const updated: ShopSettings = {
    ...current,
    seo,
  };
  await persistSettings(shop, updated);

  return { settings: updated, warnings };
}

export async function generateSeo(
  shop: string,
  formData: FormData,
): Promise<{
  generated?: { title: string; description: string; image: string };
  errors?: Record<string, string[]>;
}> {
  await authorize();
  const { data, errors } = parseGenerateSeoForm(formData);
  if (!data) {
    return { errors };
  }

  const { id, locale, title, description } = data;
  const { generateMeta } = await import(
    /* @vite-ignore */ "../../../../scripts/generate-meta.ts"
  );

  const result = await generateMeta({ id, title, description });
  const current = await fetchSettings(shop);
  const seo = { ...(current.seo ?? {}) } as Record<Locale, ShopSeoFields>;
  seo[locale] = {
    ...(seo[locale] ?? {}),
    title: result.title,
    description: result.description,
    image: result.image,
    openGraph: { ...(seo[locale]?.openGraph ?? {}), image: result.image },
  };
  const updated: ShopSettings = { ...current, seo };
  await persistSettings(shop, updated);

  return { generated: result };
}

export async function revertSeo(shop: string, timestamp: string) {
  await authorize();
  const history = await fetchDiffHistory(shop);
  const sorted = history.sort((a: any, b: any) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  const idx = sorted.findIndex((e: any) => e.timestamp === timestamp);
  if (idx === -1) throw new Error("Version not found");
  let state: ShopSettings = {
    languages: [],
    seo: {},
    freezeTranslations: false,
    updatedAt: "",
    updatedBy: "",
  };
  for (let i = 0; i < idx; i++) {
    state = { ...state, ...sorted[i].diff } as ShopSettings;
  }
  await persistSettings(shop, state);
  return state;
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

export async function resetThemeOverride(shop: string, token: string) {
  await authorize();
  const current = await fetchShop(shop);
  const { overrides, themeTokens } = removeThemeToken(current, token);
  await persistShop(shop, {
    id: current.id,
    themeOverrides: overrides,
    themeTokens,
  });
  revalidatePath(`/cms/shop/${shop}/settings`);
}

export type { Shop, ShopSettings };
