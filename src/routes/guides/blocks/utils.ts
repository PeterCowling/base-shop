import type { GuideSeoTemplateContext } from "../guide-seo/types";

export const DEFAULT_IMAGE_DIMENSIONS = {
  width: 1600,
  height: 900,
  quality: 85,
  format: "auto" as const,
};

const VALID_CF_PRESETS = new Set<"hero" | "gallery" | "thumb">(["hero", "gallery", "thumb"]);

export function isValidPreset(value: string | undefined): value is "hero" | "gallery" | "thumb" {
  return typeof value === "string" && VALID_CF_PRESETS.has(value as "hero" | "gallery" | "thumb");
}

export function normaliseString(value: unknown, fallback?: string, comparisonKey?: string): string | undefined {
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
    const options = typeof fallback === "string" ? { defaultValue: fallback } : undefined;
    const result = options ? translator(key, options) : translator(key);
    return normaliseString(result, fallback, key);
  } catch {
    return normaliseString(undefined, fallback);
  }
}
