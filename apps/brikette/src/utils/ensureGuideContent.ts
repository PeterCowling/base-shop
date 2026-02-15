 
// src/utils/ensureGuideContent.ts
import i18n from "@/i18n";
import type { GuidesNamespace } from "@/locales/guides";
import { loadLocaleResource } from "@/locales/locale-loader";
import { debugGuide, isGuideDebugEnabled } from "@/utils/debug";

import { clearGuideContentFallback, markGuideContentFallback } from "./guideContentFallbackRegistry";
import { allowEnglishGuideFallback } from "./guideFallbackPolicy";

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

type GuideContentImports = {
  en: () => Promise<unknown> | unknown;
  local?: (() => Promise<unknown> | unknown) | undefined;
};

function normalizeGuideContentInputs(lang: string, key: string): { normalizedLang: string; normalizedKey: string } {
  return {
    normalizedLang: typeof lang === "string" ? lang.trim().toLowerCase() : "",
    normalizedKey: typeof key === "string" ? key.trim() : "",
  };
}

function unwrapDefaultExport(value: unknown): AnyRecord | undefined {
  if (!value) return undefined;
  if (typeof value === "object" && "default" in (value as AnyRecord)) {
    return (value as { default?: unknown }).default as AnyRecord | undefined;
  }
  return value as AnyRecord | undefined;
}

async function maybeLoadGuideContent(params: {
  loader: (() => Promise<unknown> | unknown) | undefined;
  locale: string | undefined;
  contentNamespace: string;
}): Promise<AnyRecord | undefined> {
  const { loader, locale, contentNamespace } = params;

  const fromLoader = loader ? unwrapDefaultExport(await loader()) : undefined;
  if (isRecord(fromLoader)) return fromLoader;

  if (!locale || !contentNamespace) return undefined;
  const fromContent = unwrapDefaultExport(await loadLocaleResource(locale, contentNamespace));
  return isRecord(fromContent) ? fromContent : undefined;
}

function shouldMarkEnglishFallbackUsed(params: {
  normalizedLang: string;
  hasLocalStructured: boolean;
  allowEnglishFallback: boolean;
  englishHasStructured: boolean;
}): boolean {
  const { normalizedLang, hasLocalStructured, allowEnglishFallback, englishHasStructured } = params;
  return (
    normalizedLang.length > 0 &&
    normalizedLang !== "en" &&
    !hasLocalStructured &&
    allowEnglishFallback &&
    englishHasStructured
  );
}

function pickGuideContentPatch(params: {
  hasLocalStructured: boolean;
  localRecord: AnyRecord | undefined;
  enRecord: AnyRecord | undefined;
}): AnyRecord | undefined {
  const { hasLocalStructured, localRecord, enRecord } = params;
  if (hasLocalStructured && localRecord) return localRecord;
  if (enRecord) return localRecord ? mergeGuideContent(enRecord, localRecord) : enRecord;
  return localRecord;
}

function synthesizeIntroFromSeoDescription(patch: AnyRecord): void {
  const introVal = patch["intro"];
  const hasIntro = Array.isArray(introVal) && introVal.length > 0;
  const sectionsVal = patch["sections"];
  const hasSections = Array.isArray(sectionsVal) && sectionsVal.length > 0;
  if (hasIntro || hasSections) return;

  const seoVal = isRecord(patch["seo"]) ? (patch["seo"] as AnyRecord) : undefined;
  const desc = seoVal?.["description"];
  if (typeof desc !== "string") return;
  const trimmed = desc.trim();
  if (trimmed.length === 0) return;

  patch["intro"] = [trimmed];
}

function updateGuideContentFallbackRegistry(params: {
  fallbackUsed: boolean;
  normalizedLang: string;
  key: string;
}): void {
  const { fallbackUsed, normalizedLang, key } = params;
  if (fallbackUsed) {
    markGuideContentFallback(normalizedLang, key);
  } else {
    clearGuideContentFallback(normalizedLang, key);
  }
}

function applyGuideContentPatch(params: {
  lang: string;
  key: string;
  ns: AnyRecord;
  content: AnyRecord | undefined;
  patch: AnyRecord;
  existingRecord: AnyRecord | undefined;
}): void {
  const { lang, key, ns, content, patch, existingRecord } = params;
  const mergedPatch = existingRecord ? mergeGuideContent(patch, existingRecord) : patch;
  const nextContent: AnyRecord = { ...(content ?? {}), [key]: mergedPatch as unknown };
  const next: GuidesNamespace | AnyRecord = { ...(ns as AnyRecord), content: nextContent };
  i18n.addResourceBundle(lang, "guides", next as unknown, true, true);
}

export async function ensureGuideContent(lang: string, key: string, imports: GuideContentImports): Promise<void> {
  try {
    const { normalizedLang, normalizedKey } = normalizeGuideContentInputs(lang, key);
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
    const allowEnglishFallback = allowEnglishGuideFallback(lang);

    const localData = await maybeLoadGuideContent({
      loader: imports.local,
      locale: normalizedLang,
      contentNamespace,
    });
    const localRecord = localData ? stripEmptyStructuredContent(localData) : undefined;
    const hasLocalStructured = hasStructuredContent(localRecord);

    const enRecord = allowEnglishFallback
      ? await maybeLoadGuideContent({ loader: imports.en, locale: "en", contentNamespace })
      : undefined;
    const englishHasStructured = hasStructuredContent(enRecord);

    const fallbackUsed = shouldMarkEnglishFallbackUsed({
      normalizedLang,
      hasLocalStructured,
      allowEnglishFallback,
      englishHasStructured,
    });
    updateGuideContentFallbackRegistry({ fallbackUsed, normalizedLang, key });

    const patch = pickGuideContentPatch({ hasLocalStructured, localRecord, enRecord });
    if (!patch) return;

    // Dev-friendly synthesis: if structured content is missing but SEO
    // description exists, expose it via a minimal intro array so the
    // GenericContent renderer has something to show instead of raw keys.
    try {
      synthesizeIntroFromSeoDescription(patch);
    } catch (err) {
      if (isGuideDebugEnabled()) debugGuide("ensureGuideContent() synthesis failed", String(err));
    }

    applyGuideContentPatch({ lang, key, ns, content, patch, existingRecord });
    if (isGuideDebugEnabled()) debugGuide("ensureGuideContent() patched", { lang, key });
  } catch (e) {
    if (isGuideDebugEnabled()) debugGuide("ensureGuideContent() failed", String(e));
  }
}
