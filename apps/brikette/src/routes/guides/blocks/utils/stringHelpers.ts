/**
 * String normalization and translation utilities for block composition.
 */
import type { GuideSeoTemplateContext } from "../../guide-seo/types";

/**
 * Normalize a string value, returning undefined for empty or matching comparison keys.
 */
export function normaliseString(
  value: unknown,
  fallback?: string,
  comparisonKey?: string,
): string | undefined {
  if (typeof value !== "string") {
    return fallback?.trim() || undefined;
  }
  const trimmed = value.trim();
  if (!trimmed.length) {
    return fallback?.trim() || undefined;
  }
  if (comparisonKey && trimmed === comparisonKey) {
    return fallback?.trim() || undefined;
  }
  return trimmed;
}

/**
 * Resolve a translation using the guides translator.
 */
export function resolveTranslation(
  translator: GuideSeoTemplateContext["translateGuides"] | undefined,
  key: string | undefined,
  fallback?: string,
): string | undefined {
  if (!key) return normaliseString(undefined, fallback);
  if (typeof translator !== "function") {
    return normaliseString(undefined, fallback);
  }
  try {
    const result = translator(key, { defaultValue: fallback }) as unknown;
    return normaliseString(result, fallback, key);
  } catch {
    return normaliseString(undefined, fallback);
  }
}

/**
 * Normalize a module specifier for matching.
 */
export function normalizeModuleSpecifier(value: string): string {
  return value
    .replace(/^\.\//, "")
    .replace(/^@\/routes\/guides\//, "")
    .replace(/\.(cm)?jsx?$/i, "")
    .replace(/\.(t|j)sx?$/i, "");
}

/**
 * Normalize a module key for matching.
 */
export function normalizeModuleKey(key: string): string {
  return key
    .replace(/^\.{1,2}\//, "")
    .replace(/\.(cm)?jsx?$/i, "")
    .replace(/\.(t|j)sx?$/i, "");
}

/**
 * Check if a value is iterable.
 */
export function isIterable(value: unknown): value is Iterable<unknown> {
  return typeof value === "object" && value != null && Symbol.iterator in value;
}

/**
 * Check if a value has a default export function.
 */
export function hasDefaultExportFunction(
  value: unknown,
): value is { default: (ctx: GuideSeoTemplateContext) => React.ReactNode } {
  return (
    typeof value === "object" &&
    value != null &&
    !Array.isArray(value) &&
    !isIterable(value) &&
    "default" in (value as Record<string, unknown>) &&
    typeof (value as Record<string, unknown>)["default"] === "function"
  );
}
