// src/routes/guides/ferry-schedules/i18n.ts
import type { TFunction } from "i18next";

import appI18n from "@/i18n";
import guidesFallbackEn from "@/locales/en/guidesFallback.json";

import { GUIDE_KEY } from "./constants";

const ENGLISH_GUIDE_FALLBACK = (guidesFallbackEn as Record<string, unknown>)[GUIDE_KEY] as
  | Record<string, unknown>
  | undefined;

export function getStaticFallbackValue(key: string): unknown {
  if (!ENGLISH_GUIDE_FALLBACK) return undefined;
  const relativeKey = key.startsWith(`${GUIDE_KEY}.`)
    ? key.slice(GUIDE_KEY.length + 1)
    : key;
  return ENGLISH_GUIDE_FALLBACK[relativeKey];
}

export function getGuidesFallbackTranslator(locale: string): TFunction<"guidesFallback"> {
  const fixed = appI18n.getFixedT(locale, "guidesFallback");
  if (typeof fixed === "function") {
    return fixed as TFunction<"guidesFallback">;
  }
  return ((...args: Parameters<TFunction<"guidesFallback">>) => {
    const fallback = appI18n.getFixedT("en", "guidesFallback");
    if (typeof fallback === "function") {
      return (fallback as TFunction<"guidesFallback">)(
        ...(args as Parameters<TFunction<"guidesFallback">>),
      );
    }
    const [key] = args;
    return key;
  }) as TFunction<"guidesFallback">;
}

export function getGuidesTranslator(locale: string): TFunction<"guides"> {
  const fixed = appI18n.getFixedT(locale, "guides");
  if (typeof fixed === "function") {
    return fixed as TFunction<"guides">;
  }
  return ((...args: Parameters<TFunction<"guides">>) => {
    const fallback = appI18n.getFixedT("en", "guides");
    if (typeof fallback === "function") {
      return (fallback as TFunction<"guides">)(...(args as Parameters<TFunction<"guides">>));
    }
    const [key] = args;
    return key;
  }) as TFunction<"guides">;
}
