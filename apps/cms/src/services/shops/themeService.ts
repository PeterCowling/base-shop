import { revalidatePath } from "next/cache";
import type { Shop } from "@acme/types";
import { authorize } from "./authorization";
import { fetchShop, persistShop } from "./persistence";
import { mergeThemePatch, removeThemeToken } from "./theme";

export async function patchTheme(
  shop: string,
  patch: { themeOverrides: Record<string, string>; themeDefaults: Record<string, string> },
): Promise<{ shop: Shop }> {
  await authorize();
  const current = await fetchShop(shop);
  const { themeDefaults, overrides, themeTokens } = mergeThemePatch(
    current,
    patch.themeOverrides,
    patch.themeDefaults,
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
