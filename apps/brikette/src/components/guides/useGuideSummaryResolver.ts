// src/components/guides/useGuideSummaryResolver.ts
import { useCallback } from "react";

import type { i18n as I18nInstance } from "i18next";

import type { AppLanguage } from "@/i18n.config";
import type { GuideSummaryResolver } from "./GuideCollection.types";

const pickString = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    const found = value.find((item) => typeof item === "string" && item.trim());
    if (typeof found === "string") {
      return found;
    }
  }

  return undefined;
};

const getResourceString = (
  i18n: I18nInstance | undefined,
  language: AppLanguage,
  key: string,
): string | undefined => {
  // Prefer native i18next resource lookup when available
  if (i18n && typeof i18n.getResource === "function") {
    const value = i18n.getResource(language, "guides", key);
    return pickString(value);
  }

  // Fallback: use a fixed translator if provided (common in tests/mocks)
  if (i18n && typeof i18n.getFixedT === "function") {
    const t = i18n.getFixedT(language, "guides");
    if (typeof t === "function") {
      const translated = t(key);
      // If the translator returns the key itself, treat as missing
      if (typeof translated === "string" && translated.trim() && translated !== key) {
        return translated;
      }
    }
  }

  return undefined;
};

const INTRO_RESOURCE_PATHS = ["content", "meta"] as const;

export const useGuideSummaryResolver = (
  i18n: I18nInstance | undefined,
  lang: AppLanguage,
): GuideSummaryResolver =>
  useCallback<GuideSummaryResolver>(
    (key) => {
      const descriptionKey = `content.${key}.seo.description`;
      const description =
        getResourceString(i18n, lang, descriptionKey) ?? getResourceString(i18n, "en", descriptionKey);

      if (description) {
        return description;
      }

      for (const resourcePrefix of INTRO_RESOURCE_PATHS) {
        const introKey = `${resourcePrefix}.${key}.intro`;
        const intro =
          getResourceString(i18n, lang, introKey) ?? getResourceString(i18n, "en", introKey);

        if (intro) {
          return intro;
        }
      }

      return undefined;
    },
    [i18n, lang],
  );
