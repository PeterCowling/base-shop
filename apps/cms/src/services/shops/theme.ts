import { syncTheme, loadTokens } from "@platform-core/src/createShop";
import type { Shop } from "@acme/types";
import type { ShopForm } from "./validation";

export async function buildThemeData(
  shop: string,
  form: ShopForm,
  current: Shop,
): Promise<{
  themeDefaults: Record<string, string>;
  overrides: Record<string, string>;
  themeTokens: Record<string, string>;
}> {
  const overrides = {
    ...(current.themeOverrides ?? {}),
    ...(form.themeOverrides as Record<string, string>),
  } as Record<string, string>;

  let themeDefaults = form.themeDefaults as Record<string, string> | undefined;
  if (!themeDefaults || Object.keys(themeDefaults).length === 0) {
    themeDefaults =
      current.themeId !== form.themeId
        ? await syncTheme(shop, form.themeId)
        : current.themeDefaults ?? (await loadTokens(form.themeId));
  } else {
    themeDefaults = { ...(current.themeDefaults ?? {}), ...themeDefaults };
  }

  const themeTokens = { ...themeDefaults, ...overrides };
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
