import { syncTheme, loadTokens } from "@platform-core/src/createShop";
import type { Shop } from "@acme/types";
import type { ShopForm } from "./validation";

export async function buildThemeData(
  shop: string,
  form: ShopForm,
  current: Shop
): Promise<{
  themeDefaults: Record<string, string>;
  overrides: Record<string, string>;
  themeTokens: Record<string, string>;
}> {
  const overridePatch =
    (form.themeOverrides as Record<string, string | null | undefined>) ?? {};
  const overrides = { ...(current.themeOverrides ?? {}) } as Record<
    string,
    string
  >;
  for (const [k, v] of Object.entries(overridePatch)) {
    if (v == null || v === "") delete overrides[k];
    else overrides[k] = v;
  }

  const defaultsPatch =
    (form.themeDefaults as Record<string, string> | undefined) ?? {};
  let themeDefaults: Record<string, string>;
  if (Object.keys(defaultsPatch).length > 0) {
    themeDefaults = {
      ...(current.themeDefaults ?? {}),
      ...defaultsPatch,
    } as Record<string, string>;
  } else if (!current.themeDefaults || current.themeId !== form.themeId) {
    themeDefaults =
      current.themeId !== form.themeId
        ? await syncTheme(shop, form.themeId)
        : await loadTokens(form.themeId);
  } else {
    themeDefaults = current.themeDefaults as Record<string, string>;
  }

  const themeTokens = { ...themeDefaults, ...overrides } as Record<string, string>;
  return { themeDefaults, overrides, themeTokens };
}

export function removeThemeToken(
  current: Shop,
  token: string
): { overrides: Record<string, string>; themeTokens: Record<string, string> } {
  const overrides = { ...(current.themeOverrides ?? {}) } as Record<string, string>;
  delete overrides[token];
  const themeTokens = { ...(current.themeDefaults ?? {}), ...overrides } as Record<
    string,
    string
  >;
  return { overrides, themeTokens };
}
