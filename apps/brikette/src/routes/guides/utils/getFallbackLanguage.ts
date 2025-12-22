// src/routes/guides/utils/getFallbackLanguage.ts
import { i18nConfig } from "@/i18n.config";

const DEFAULT_FALLBACK = "en" as const;

const getFallbackLanguage = (): string => {
  const fallback = i18nConfig.fallbackLng;

  if (!fallback) {
    return DEFAULT_FALLBACK;
  }

  if (typeof fallback === "string") {
    return fallback;
  }

  if (Array.isArray(fallback)) {
    return fallback[0] ?? DEFAULT_FALLBACK;
  }

  if (typeof fallback === "object") {
    const defaultEntry = (fallback as Record<string, unknown>)["default"];

    if (typeof defaultEntry === "string") {
      return defaultEntry;
    }

    if (Array.isArray(defaultEntry)) {
      return defaultEntry[0] ?? DEFAULT_FALLBACK;
    }
  }

  return DEFAULT_FALLBACK;
};

export default getFallbackLanguage;
