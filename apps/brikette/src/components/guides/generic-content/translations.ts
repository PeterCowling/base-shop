// src/components/guides/generic-content/translations.ts
import type { GenericContentTranslator } from "./types";
import { toTrimmedString } from "./strings";

export function resolveLabelFallback(t: GenericContentTranslator, key: string): string | undefined {
  const value = toTrimmedString(t(key));
  if (value && value !== key) {
    return value;
  }
  const english = toTrimmedString(t(key, { lng: "en" }));
  if (english && english !== key) {
    return english;
  }
  return undefined;
}

export function resolveTitle(
  raw: unknown,
  key: string,
  fallback: string | undefined,
  override?: string,
): string {
  const text = toTrimmedString(raw);
  if (text && text !== key) {
    return text;
  }
  if (override && override.trim().length > 0) {
    return override;
  }
  const fallbackText = toTrimmedString(fallback);
  if (fallbackText && fallbackText !== key) {
    return fallbackText;
  }
  return key;
}
