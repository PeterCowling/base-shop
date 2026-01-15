/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
// src/utils/ensureGuideContent.ts
import i18n from "@/i18n";
import { debugGuide, isGuideDebugEnabled } from "@/utils/debug";
import type { GuidesNamespace } from "@/locales/guides";
import { allowEnglishGuideFallback } from "./guideFallbackPolicy";
import { clearGuideContentFallback, markGuideContentFallback } from "./guideContentFallbackRegistry";
import { loadLocaleResource } from "@/locales/locale-loader";

type GuideTestGlobalStore = {
  manualGuideContentOverrides?: Map<string, Set<string>>;
};

const GUIDE_TEST_STATE = globalThis as { __GUIDES_TEST__?: GuideTestGlobalStore };

function hasManualGuideContentOverride(lang: string, contentKey: string): boolean {
  try {
    const overrides = GUIDE_TEST_STATE.__GUIDES_TEST__?.manualGuideContentOverrides;
    if (!overrides) return false;
    const langOverrides = overrides.get(lang);
    return langOverrides?.has(contentKey) ?? false;
  } catch {
    return false;
  }
}

type AnyRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is AnyRecord => Boolean(v) && typeof v === "object" && !Array.isArray(v);

const toTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toNormalisedStringArray = (value: unknown): string[] => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    const result: string[] = [];
    for (const entry of value) {
      if (typeof entry === "string") {
        const trimmed = entry.trim();
        if (trimmed.length > 0) {
          result.push(trimmed);
        }
        continue;
      }
      if (Array.isArray(entry)) {
        result.push(...toNormalisedStringArray(entry));
        continue;
      }
      if (isRecord(entry)) {
        const defaultValue = (entry as { default?: unknown }).default;
        if (typeof defaultValue === "string" || Array.isArray(defaultValue)) {
          result.push(...toNormalisedStringArray(defaultValue));
          continue;
        }
        const valueProp = (entry as { value?: unknown }).value;
        if (typeof valueProp === "string" || Array.isArray(valueProp)) {
          result.push(...toNormalisedStringArray(valueProp));
        }
      }
    }
    return result;
  }

  if (isRecord(value)) {
    const defaultValue = (value as { default?: unknown }).default;
    if (typeof defaultValue === "string" || Array.isArray(defaultValue)) {
      return toNormalisedStringArray(defaultValue);
    }
    const valueProp = (value as { value?: unknown }).value;
    if (typeof valueProp === "string" || Array.isArray(valueProp)) {
      return toNormalisedStringArray(valueProp);
    }
  }

  return [];
};

const collectStringEntries = (value: unknown): string[] => toNormalisedStringArray(value);

const toRecordArray = (value: unknown): AnyRecord[] => {
  if (Array.isArray(value)) {
    const result: AnyRecord[] = [];
    for (const entry of value) {
      if (isRecord(entry)) {
        result.push(entry);
      } else if (Array.isArray(entry)) {
        result.push(...toRecordArray(entry));
      }
    }
    return result;
  }

  if (isRecord(value)) {
    const defaultValue = (value as { default?: unknown }).default;
    if (Array.isArray(defaultValue) || isRecord(defaultValue)) {
      return toRecordArray(defaultValue);
    }
  }

  return [];
};

const hasIntroContent = (value: unknown): boolean => toNormalisedStringArray(value).length > 0;

const hasSectionContent = (value: unknown): boolean =>
  toRecordArray(value).some((entry) => {
    const title = toTrimmedString(entry["title"]);
    if (title.length > 0) return true;
    if (collectStringEntries(entry["body"]).length > 0) return true;
    if (collectStringEntries(entry["items"]).length > 0) return true;
    if (collectStringEntries((entry as { list?: unknown })["list"]).length > 0) return true;
    const summaryEntries = collectStringEntries(entry["summary"]);
    return summaryEntries.length > 0;
  });

const hasFaqContent = (value: unknown): boolean =>
  toRecordArray(value).some((entry) => {
    const question = toTrimmedString(entry["q"] ?? entry["question"]);
    if (question.length === 0) return false;
    const answers = collectStringEntries(entry["a"] ?? entry["answer"]);
    return answers.length > 0;
  });

const hasStructuredContent = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return (
    hasIntroContent(value["intro"]) ||
    hasSectionContent(value["sections"]) ||
    hasFaqContent(value["faqs"])
  );
};

const stripEmptyStructuredContent = (value: AnyRecord): AnyRecord => {
  const next: AnyRecord = { ...value };
  if (!hasIntroContent(next["intro"])) delete next["intro"];
  if (!hasSectionContent(next["sections"])) delete next["sections"];
  if (!hasFaqContent(next["faqs"])) delete next["faqs"];
  return next;
};

const mergeGuideContent = (base: AnyRecord, overrides: AnyRecord): AnyRecord => {
  const result: AnyRecord = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      result[key] = value.slice();
      continue;
    }
    if (isRecord(value)) {
      const existing = result[key];
      result[key] = isRecord(existing)
        ? mergeGuideContent(existing, value)
        : mergeGuideContent({}, value);
      continue;
    }
    result[key] = value;
  }
  return result;
};

export async function ensureGuideContent(lang: string, key: string, imports: {
  en: () => Promise<unknown> | unknown;
  local?: (() => Promise<unknown> | unknown) | undefined;
}): Promise<void> {
  try {
    const normalizedLang = typeof lang === "string" ? lang.trim().toLowerCase() : "";
    const normalizedKey = typeof key === "string" ? key.trim() : "";
    if (normalizedLang && normalizedKey && hasManualGuideContentOverride(normalizedLang, normalizedKey)) {
      clearGuideContentFallback(normalizedLang, normalizedKey);
      return;
    }
    const nsUnknown = (i18n.getResourceBundle(lang, "guides") as unknown) ?? {};
    const ns = isRecord(nsUnknown) ? nsUnknown : {};
    const content = isRecord(ns["content"]) ? (ns["content"] as AnyRecord) : undefined;
    const existing = content?.[key];
    if (hasStructuredContent(existing)) {
      clearGuideContentFallback(lang, key);
      return;
    }

    const existingRecord = isRecord(existing) ? (existing as AnyRecord) : undefined;

    const contentNamespace = normalizedKey ? `guides/content/${normalizedKey}` : "";
    const maybeLoad = async (
      loader: (() => Promise<unknown> | unknown) | undefined,
      locale?: string,
    ) => {
      let data: AnyRecord | undefined;
      if (loader) {
        const m = await loader();
        data = (m && typeof m === "object" && "default" in (m as AnyRecord)
          ? (m as { default?: unknown }).default
          : m) as AnyRecord | undefined;
      }
      if (!data && locale && contentNamespace) {
        const fromContent = await loadLocaleResource(locale, contentNamespace);
        data = (fromContent && typeof fromContent === "object" && "default" in (fromContent as AnyRecord)
          ? (fromContent as { default?: unknown }).default
          : fromContent) as AnyRecord | undefined;
      }
      return data;
    };

    const allowEnglishFallback = allowEnglishGuideFallback(lang);
    const localData = await maybeLoad(imports.local, normalizedLang);
    const localRecord = isRecord(localData) ? stripEmptyStructuredContent(localData as AnyRecord) : undefined;
    const hasLocalStructured = hasStructuredContent(localRecord);
    const enData = allowEnglishFallback ? await maybeLoad(imports.en, "en") : undefined;
    const enRecord = isRecord(enData) ? (enData as AnyRecord) : undefined;
    const englishHasStructured = hasStructuredContent(enRecord);
    const fallbackUsed =
      normalizedLang &&
      normalizedLang !== "en" &&
      !hasLocalStructured &&
      allowEnglishFallback &&
      englishHasStructured;
    if (fallbackUsed) {
      markGuideContentFallback(normalizedLang, key);
    } else {
      clearGuideContentFallback(normalizedLang, key);
    }
    let patch: AnyRecord | undefined;
    if (hasLocalStructured && localRecord) {
      patch = localRecord;
    } else if (enRecord) {
      patch = localRecord ? mergeGuideContent(enRecord, localRecord) : enRecord;
    } else if (localRecord) {
      patch = localRecord;
    }
    if (patch) {
      // Dev-friendly synthesis: if structured content is missing but SEO
      // description exists, expose it via a minimal intro array so the
      // GenericContent renderer has something to show instead of raw keys.
      try {
        const patchRec = patch as AnyRecord;
        const introVal = patchRec["intro"];
        const hasIntro = Array.isArray(introVal) && introVal.length > 0;
        const sectionsVal = patchRec["sections"];
        const hasSections = Array.isArray(sectionsVal) && sectionsVal.length > 0;
        const seoVal = isRecord(patchRec["seo"]) ? (patchRec["seo"] as AnyRecord) : undefined;
        const desc = seoVal?.["description"];
        if (!hasIntro && !hasSections && typeof desc === "string" && desc.trim().length > 0) {
          patchRec["intro"] = [desc];
        }
      } catch (err) {
        if (isGuideDebugEnabled()) debugGuide("ensureGuideContent() synthesis failed", String(err));
      }

      const mergedPatch = existingRecord ? mergeGuideContent(patch as AnyRecord, existingRecord) : patch;
      const nextContent: AnyRecord = { ...(content ?? {}), [key]: mergedPatch as unknown };
      const next: GuidesNamespace | AnyRecord = { ...(ns as AnyRecord), content: nextContent };
      i18n.addResourceBundle(lang, "guides", next as unknown, true, true);
      if (isGuideDebugEnabled()) debugGuide("ensureGuideContent() patched", { lang, key });
    }
  } catch (e) {
    if (isGuideDebugEnabled()) debugGuide("ensureGuideContent() failed", String(e));
  }
}
