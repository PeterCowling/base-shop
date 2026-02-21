// src/routes/guides/guide-seo/translateGuidesBuilder.ts
import { useMemo } from "react";

import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import type { AppLanguage } from "@/i18n.config";
import { asGenericContentTranslator, tagTranslator } from "@/utils/i18n-types";

import {
  checkEnValue,
  checkPrimaryValue,
  tryBundles,
  tryEnglishFallback,
  tryI18nStore,
  tryLocalizedFallback,
} from "./translateGuidesHelpers";
import type { Translator } from "./types";

type GetFixedT = (lng: string, ns?: string) => Translator;
type I18nLike = { getFixedT?: GetFixedT; __tGuidesFallback?: Translator };

export function useTranslateGuides(
  tGuides: Translator,
  tGuidesFallback: Translator,
  guidesEn: Translator,
  lang: AppLanguage,
  i18n: I18nLike,
  resolveFixedT: (language: string, namespace?: string) => Translator,
): GenericContentTranslator {
  return useMemo<GenericContentTranslator>(() => {
    const translator = asGenericContentTranslator((...args) => {
      const [rawKey, options] = args;
      const keyAsString = typeof rawKey === "string" ? rawKey : undefined;
      const primary: unknown = tGuides(...args);

      const primaryIsKey = (val: unknown): boolean =>
        typeof val === "string" && keyAsString ? val.trim() === keyAsString : false;

      // Treat both the canonical key (e.g., "content.boatTours.galleryHeading") and the
      // compact fallback form (e.g., "boatTours.galleryHeading") as unresolved keys.
      // Some test environments stub i18n to return the queried key string when a value
      // is missing; when we probe guidesFallback with the compact key we must not treat
      // that returned key string as a meaningful translation.
      const isUnresolvedKey = (val: unknown): boolean => {
        if (typeof val !== "string" || !keyAsString) return false;
        const trimmed = val.trim();
        if (trimmed === keyAsString) return true;
        if (keyAsString.startsWith("content.")) {
          const alt = keyAsString.replace(/^content\./, "");
          if (trimmed === alt) return true;
        }
        return false;
      };

      const getEnTranslatorValue = () => guidesEn(...args);

      // Detect if we have an explicit EN translator available via react-i18next
      // (i18n.getFixedT). When present, prefer it and avoid falling back to
      // store/bundle reads so tests can fully control EN values.
      const hasExplicitEn = (() => {
        try {
          return typeof (i18n as I18nLike)?.getFixedT === "function";
        } catch (err) {
          void err;
          return false;
        }
      })();

      // 1) Prefer localized value if it's meaningful
      const primaryResult = checkPrimaryValue(primary, primaryIsKey);
      if (primaryResult !== undefined) return primaryResult;

      // 2) Try guidesFallback namespace: prefer localized fallback first so
      //    curated localized copy can override English structured content when
      //    the active locale lacks sections. Support both the canonical
      //    `content.<guideKey>.*` key shape and the compact
      //    `<guideKey>.*` shape used by guidesFallback JSON in tests.
      const { result: localFbResult, explicitEmpty } = tryLocalizedFallback(
        tGuidesFallback,
        keyAsString,
        options as Record<string, unknown> | undefined,
        primaryIsKey,
        isUnresolvedKey,
      );
      if (localFbResult !== undefined) return localFbResult;
      if (explicitEmpty) return [];

      // 3) Try EN translator (from guidesEn when provided), but only resolve
      //    it when neither the localized value nor the localized fallback was meaningful.
      const enValue = getEnTranslatorValue();
      const enResult = checkEnValue(enValue, primaryIsKey);
      if (enResult !== undefined) return enResult;
      // 4) Try English guidesFallback copy as a curated backup when neither the
      //    localized namespace nor structured EN content produced a value.
      //    Support both `content.<guideKey>.*` and `<guideKey>.*` key shapes.
      const enFb = tryEnglishFallback(
        resolveFixedT,
        keyAsString,
        options as Record<string, unknown> | undefined,
        primaryIsKey,
        isUnresolvedKey,
      );
      if (enFb !== undefined) return enFb;

      // 5) Try i18n store resources via getGuideResource (locale → EN)
      // Only when an explicit EN translator is not available.
      const fromStore = tryI18nStore(lang, keyAsString, hasExplicitEn);
      if (fromStore !== undefined) return fromStore;

      // 6) Last resort: read directly from eager guides bundles when there is
      // no explicit EN translator. This avoids overriding test-provided EN
      // dictionaries.
      const fromBundles = tryBundles(
        lang,
        keyAsString,
        options as Record<string, unknown> | undefined,
        hasExplicitEn,
      );
      if (fromBundles !== undefined) return fromBundles;

      // Give up: return original primary (usually the key) to aid debugging
      return primary;
    });

    // Expose language/namespace for tests that introspect translator identity
    tagTranslator(translator, lang, "guides");

    return translator;
  }, [guidesEn, tGuides, lang, i18n, resolveFixedT, tGuidesFallback]);
}
