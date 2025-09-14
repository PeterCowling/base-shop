import { revalidatePath } from "next/cache";
import type { Locale, Shop, ShopSettings } from "@acme/types";
import { authorize, fetchShop, persistShop, fetchSettings, persistSettings } from "./helpers";
import { parseShopForm } from "./validation";
import { buildThemeData, removeThemeToken, mergeThemePatch } from "./theme";

export async function updateShop(
  shop: string,
  formData: FormData,
): Promise<{ shop?: Shop; errors?: Record<string, string[]> }> {
  await authorize();
  const current = await fetchShop(shop);
  const { data, errors } = parseShopForm(formData);
  if (!data) {
    return { errors };
  }
  if (current.id !== data.id) throw new Error(`Shop ${data.id} not found in ${shop}`);

  const theme = await buildThemeData(shop, data, current);

  const patch: Partial<Shop> & { id: string } = {
    id: current.id,
    name: data.name,
    themeId: data.themeId,
    catalogFilters: data.catalogFilters,
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

export async function patchTheme(
  shop: string,
  patch: {
    themeOverrides?: Record<string, string>;
    themeDefaults?: Record<string, string>;
  },
): Promise<{ shop: Shop }> {
  await authorize();
  const current = await fetchShop(shop);
  const { themeDefaults, overrides, themeTokens } = mergeThemePatch(
    current,
    patch.themeOverrides ?? {},
    patch.themeDefaults ?? {},
  );
  const saved = await persistShop(shop, {
    id: current.id,
    themeDefaults,
    themeOverrides: overrides,
    themeTokens,
  });
  return { shop: saved };
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
