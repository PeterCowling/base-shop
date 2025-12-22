import type { TFunction } from "i18next";

import { normaliseStringList, safeString } from "./normalisers";

export function getStringArray(
  translator: TFunction<"guides">,
  fallback: TFunction<"guides">,
  key: string
): string[] {
  const primary = normaliseStringList(translator(key, { returnObjects: true }));
  if (primary.length > 0) {
    return primary;
  }
  return normaliseStringList(fallback(key, { returnObjects: true }));
}

function resolveCandidate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getString(
  translator: TFunction<"guides">,
  fallback: TFunction<"guides">,
  key: string,
  defaultValue = ""
): string {
  const primaryValue = translator(key, { defaultValue });
  const primaryCandidate = resolveCandidate(primaryValue);

  const shouldUsePrimary =
    primaryCandidate != null && primaryCandidate !== key && primaryCandidate !== defaultValue;

  if (shouldUsePrimary) {
    return primaryCandidate;
  }

  const fallbackValue = fallback(key, { defaultValue });
  const fallbackCandidate = resolveCandidate(fallbackValue);

  const shouldUseFallback =
    fallbackCandidate != null && fallbackCandidate !== key && fallbackCandidate !== defaultValue;

  if (shouldUseFallback) {
    return fallbackCandidate;
  }

  return safeString(defaultValue);
}
