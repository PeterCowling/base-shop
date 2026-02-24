import { syncTheme } from "@acme/platform-core/createShop";
import { baseTokens, loadThemeTokens } from "@acme/platform-core/themeTokens";
import {
  assertValidThemeTokens,
  diffThemeTokenKeys,
} from "@acme/platform-core/themeValidation";
import type { Shop } from "@acme/types";

import type { ShopForm } from "./validation";

function currentThemeTokens(current: Shop): Record<string, string> {
  return {
    ...(current.themeDefaults ?? {}),
    ...(current.themeOverrides ?? {}),
  } as Record<string, string>;
}

function validateThemeState({
  themeDefaults,
  overrides,
  themeTokens,
  previousThemeTokens,
}: {
  themeDefaults: Record<string, string>;
  overrides: Record<string, string>;
  themeTokens: Record<string, string>;
  previousThemeTokens: Record<string, string>;
}) {
  const writeValidationOptions = {
    unresolvedColorReferenceSeverity: "error" as const,
    unresolvableContrastPairSeverity: "error" as const,
  };
  assertValidThemeTokens(themeDefaults, {
    context: "theme defaults",
    contrastRequirements: [],
    ...writeValidationOptions,
  });
  assertValidThemeTokens(overrides, {
    context: "theme overrides",
    allowedTokenKeys: Object.keys(themeDefaults),
    contrastRequirements: [],
    ...writeValidationOptions,
  });
  assertValidThemeTokens(themeTokens, {
    context: "merged theme tokens",
    allowedTokenKeys: Object.keys(themeDefaults),
    baselineTokens: previousThemeTokens,
    changedTokenKeys: diffThemeTokenKeys(previousThemeTokens, themeTokens),
    ...writeValidationOptions,
  });
}

export async function buildThemeData(
  shop: string,
  form: ShopForm,
  current: Shop
): Promise<{
  themeDefaults: Record<string, string>;
  overrides: Record<string, string>;
  themeTokens: Record<string, string>;
}> {
  const overrides = form.themeOverrides as Record<string, string>;
  let themeDefaults: Record<string, string>;
  if (!form.themeDefaults || Object.keys(form.themeDefaults).length === 0) {
    themeDefaults = (
      current.themeId !== form.themeId
        ? await syncTheme(shop, form.themeId)
        : { ...baseTokens, ...(await loadThemeTokens(form.themeId)) }
    ) as Record<string, string>;
  } else {
    themeDefaults = form.themeDefaults as Record<string, string>;
  }
  const themeTokens = { ...themeDefaults, ...overrides };
  validateThemeState({
    themeDefaults,
    overrides,
    themeTokens,
    previousThemeTokens: currentThemeTokens(current),
  });
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

export function mergeThemePatch(
  current: Shop,
  patchOverrides: Record<string, string>,
  patchDefaults: Record<string, string>
): {
  themeDefaults: Record<string, string>;
  overrides: Record<string, string>;
  themeTokens: Record<string, string>;
} {
  const themeDefaults = {
    ...(current.themeDefaults ?? {}),
    ...patchDefaults,
  } as Record<string, string>;
  const overrides = {
    ...(current.themeOverrides ?? {}),
    ...patchOverrides,
  } as Record<string, string>;
  for (const [k, v] of Object.entries(overrides)) {
    if (v == null || v === themeDefaults[k]) delete overrides[k];
  }
  const themeTokens = { ...themeDefaults, ...overrides } as Record<string, string>;
  validateThemeState({
    themeDefaults,
    overrides,
    themeTokens,
    previousThemeTokens: currentThemeTokens(current),
  });
  return { themeDefaults, overrides, themeTokens };
}
