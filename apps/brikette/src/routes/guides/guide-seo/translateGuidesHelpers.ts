// src/routes/guides/guide-seo/translateGuidesHelpers.ts
import { IS_DEV } from "@/config/env";
import type { AppLanguage } from "@/i18n.config";
import getGuideResource from "@/routes/guides/utils/getGuideResource";

import { getGuidesBundle, type GuidesNamespace } from "../../../locales/guides";

import type { Translator } from "./types";

export function getFromBundle(
  bundle: GuidesNamespace | undefined,
  key: string,
  options?: Record<string, unknown>,
): unknown {
  if (!bundle || !key) return undefined;
  // Basic dotted-path resolver for guides namespace
  const parts = key.split(".");
  let cursor: unknown = bundle as Record<string, unknown>;
  for (const part of parts) {
    if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  // Honour returnObjects request; otherwise coerce primitives to string
  if (options && (options as { returnObjects?: boolean }).returnObjects) {
    return cursor;
  }
  return typeof cursor === "string" ? cursor : undefined;
}

export function isMeaningfulObject(val: unknown): boolean {
  if (!val || typeof val !== "object" || Array.isArray(val)) return false;
  try {
    const values = Object.values(val as Record<string, unknown>);
    return values.some((v) => {
      if (typeof v === "string") {
        const s = v.trim();
        if (!s) return false;
        // Treat i18n keys (e.g., "content.xyz...") as not meaningful
        return !s.startsWith("content.");
      }
      if (Array.isArray(v)) return v.length > 0;
      return false;
    });
  } catch (err) {
    void err;
    return false;
  }
}

export function tryLocalizedFallback(
  tGuidesFallback: Translator,
  keyAsString: string | undefined,
  options: Record<string, unknown> | undefined,
  primaryIsKey: (val: unknown) => boolean,
  isUnresolvedKey: (val: unknown) => boolean,
): { result: unknown; explicitEmpty: boolean } {
  let explicitEmpty = false;
  if (!keyAsString) return { result: undefined, explicitEmpty };

  try {
    const tryLocal = (k: string): unknown =>
      tGuidesFallback(k, options as Record<string, unknown> | undefined) as unknown;
    const localFbPrimary = tryLocal(keyAsString);
    if (Array.isArray(localFbPrimary) && localFbPrimary.length === 0) {
      explicitEmpty = true;
    }
    const localFbAlt = keyAsString.startsWith("content.")
      ? tryLocal(keyAsString.replace(/^content\./, ""))
      : undefined;
    if (Array.isArray(localFbAlt) && localFbAlt.length === 0) {
      explicitEmpty = true;
    }
    const pickLocal = (candidate: unknown): unknown | undefined => {
      if (typeof candidate === "string") {
        const s = candidate.trim();
        if (s.length > 0 && !primaryIsKey(candidate) && !isUnresolvedKey(candidate)) return s;
      } else if (Array.isArray(candidate)) {
        if (candidate.length > 0) return candidate as unknown;
      } else if (candidate != null) {
        if (isMeaningfulObject(candidate)) return candidate as unknown;
      }
      return undefined;
    };
    const pickedLocal = pickLocal(localFbPrimary) ?? pickLocal(localFbAlt);
    return { result: pickedLocal, explicitEmpty };
  } catch (err) {
    if (IS_DEV) console.debug("[translations] local fallback", err);
    return { result: undefined, explicitEmpty };
  }
}

export function tryEnglishFallback(
  resolveFixedT: (language: string, namespace?: string) => Translator,
  keyAsString: string | undefined,
  options: Record<string, unknown> | undefined,
  primaryIsKey: (val: unknown) => boolean,
  isUnresolvedKey: (val: unknown) => boolean,
): unknown {
  if (!keyAsString) return undefined;

  try {
    const enFbFixed = resolveFixedT("en", "guidesFallback");
    if (typeof enFbFixed === "function") {
      const tryEnFb = (k: string): unknown =>
        enFbFixed(k as string, options as Record<string, unknown> | undefined) as unknown;
      const enFbPrimary = tryEnFb(keyAsString);
      const enFbAlt = keyAsString.startsWith("content.")
        ? tryEnFb(keyAsString.replace(/^content\./, ""))
        : undefined;
      const pickEn = (candidate: unknown): unknown | undefined => {
        if (typeof candidate === "string") {
          const s = (candidate as string).trim();
          if (s.length > 0 && !primaryIsKey(candidate) && !isUnresolvedKey(candidate)) return candidate;
        } else if (Array.isArray(candidate)) {
          if ((candidate as unknown[]).length > 0) return candidate as unknown;
        } else if (candidate != null) {
          if (isMeaningfulObject(candidate)) return candidate as unknown;
        }
        return undefined;
      };
      const pickedEn = pickEn(enFbPrimary) ?? pickEn(enFbAlt);
      return pickedEn;
    }
  } catch (err) {
    if (IS_DEV) console.debug("[translations] EN fallback", err);
  }
  return undefined;
}

export function tryI18nStore(
  lang: AppLanguage,
  keyAsString: string | undefined,
  hasExplicitEn: boolean,
): unknown {
  if (hasExplicitEn || !keyAsString) return undefined;

  try {
    const fromStoreLocal = getGuideResource<unknown>(lang, keyAsString);
    if (
      typeof fromStoreLocal === "string" ||
      (Array.isArray(fromStoreLocal) && fromStoreLocal.length > 0) ||
      (fromStoreLocal && typeof fromStoreLocal === "object")
    ) {
      return fromStoreLocal as unknown;
    }
  } catch (err) {
    void err;
  }
  try {
    const fromStoreEn = getGuideResource<unknown>("en", keyAsString);
    if (
      typeof fromStoreEn === "string" ||
      (Array.isArray(fromStoreEn) && fromStoreEn.length > 0) ||
      (fromStoreEn && typeof fromStoreEn === "object")
    ) {
      return fromStoreEn as unknown;
    }
  } catch (err) {
    void err;
  }
  return undefined;
}

export function tryBundles(
  lang: AppLanguage,
  keyAsString: string | undefined,
  options: Record<string, unknown> | undefined,
  hasExplicitEn: boolean,
): unknown {
  if (hasExplicitEn || !keyAsString) return undefined;

  const bundleLocal = getGuidesBundle(lang);
  const bundleEn = lang === "en" ? bundleLocal : getGuidesBundle("en");
  const fromLocal = getFromBundle(
    bundleLocal,
    keyAsString,
    options as Record<string, unknown> | undefined,
  );
  if (fromLocal != null && (Array.isArray(fromLocal) ? fromLocal.length > 0 : true)) {
    return fromLocal as unknown;
  }
  const fromEn = getFromBundle(
    bundleEn,
    keyAsString,
    options as Record<string, unknown> | undefined,
  );
  if (fromEn != null && (Array.isArray(fromEn) ? fromEn.length > 0 : true)) {
    return fromEn as unknown;
  }
  return undefined;
}

export function checkPrimaryValue(
  primary: unknown,
  primaryIsKey: (val: unknown) => boolean,
): unknown | undefined {
  if (typeof primary === "string") {
    if (primary.trim().length > 0 && !primaryIsKey(primary)) return primary;
  } else if (Array.isArray(primary)) {
    if (primary.length > 0) return primary;
  } else if (primary != null) {
    // Only accept objects that look meaningful; otherwise try fallbacks
    if (isMeaningfulObject(primary)) return primary;
  }
  return undefined;
}

export function checkEnValue(
  enValue: unknown,
  primaryIsKey: (val: unknown) => boolean,
): unknown | undefined {
  if (typeof enValue === "string") {
    if (!primaryIsKey(enValue) && enValue.trim().length > 0) return enValue;
  } else if (Array.isArray(enValue)) {
    if (enValue.length > 0) return enValue;
  } else if (enValue != null) {
    if (isMeaningfulObject(enValue)) return enValue;
  }
  return undefined;
}
