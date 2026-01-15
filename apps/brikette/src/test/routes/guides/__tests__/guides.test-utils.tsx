import type { ReactElement } from "react";
import { renderWithProviders } from "@tests/renderers";
import i18n from "@/i18n";
import type { TFunction } from "i18next";
import { vi } from "vitest";

type NamespaceKey = "guides" | "guidesFallback" | "guides.tags" | "header" | "translation";

const touchedBundles = new Set<string>();
let currentLanguage = "en";

const guideBackendOverridesKey = "__GUIDES_BACKEND_OVERRIDES__";
const guideBackendOverrides: Record<string, Record<string, unknown>> =
  ((globalThis as Record<string, unknown>)[guideBackendOverridesKey] as
    | Record<string, Record<string, unknown>>
    | undefined) ?? ((globalThis as Record<string, unknown>)[guideBackendOverridesKey] = {});
const guideTestState = ((globalThis as Record<string, unknown>).__GUIDES_TEST__ ??= {}) as {
  manualGuideContentOverrides?: Map<string, Set<string>>;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const setNested = (target: Record<string, unknown>, key: string, value: unknown) => {
  const segments = key.split(".");
  let cursor: Record<string, unknown> = target;
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (!segment) continue;
    if (i === segments.length - 1) {
      cursor[segment] = value;
      return;
    }
    const next = cursor[segment];
    if (isPlainObject(next)) {
      cursor = next;
    } else {
      const created: Record<string, unknown> = {};
      cursor[segment] = created;
      cursor = created;
    }
  }
};

const normalizeEntries = (entries: Record<string, unknown>): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (key.includes(".")) {
      setNested(normalized, key, value);
      continue;
    }
    if (isPlainObject(value) && isPlainObject(normalized[key])) {
      normalized[key] = { ...(normalized[key] as Record<string, unknown>), ...value };
      continue;
    }
    normalized[key] = value;
  }
  return normalized;
};

const mergeResources = (base: Record<string, unknown>, updates: Record<string, unknown>): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(updates)) {
    const existing = merged[key];
    if (Array.isArray(value)) {
      merged[key] = [...value];
      continue;
    }
    if (isPlainObject(value)) {
      const nextBase = isPlainObject(existing) ? (existing as Record<string, unknown>) : {};
      merged[key] = mergeResources(nextBase, value);
      continue;
    }
    merged[key] = value;
  }
  return merged;
};

const registerGuideContentOverride = (lang: string, normalized: Record<string, unknown>) => {
  const content = normalized["content"];
  if (!isPlainObject(content)) return;
  const guideKeys = Object.keys(content);
  if (guideKeys.length === 0) return;
  const overrides =
    guideTestState.manualGuideContentOverrides ?? (guideTestState.manualGuideContentOverrides = new Map());
  const existing = overrides.get(lang) ?? new Set<string>();
  for (const guideKey of guideKeys) {
    if (guideKey) existing.add(guideKey);
  }
  overrides.set(lang, existing);
};

export const capturedFaqFallbacks = new Map<string, (lang: string) => unknown>();

export const genericContentMock = vi.fn((props: { guideKey?: string; t?: TFunction }) => (
  <>
    {process.env.DEBUG_GUIDE_TRANSLATIONS === "1"
      ? // eslint-disable-next-line no-console -- Local debug helper for coverage failures
        console.log("[guides.test-utils] genericContentMock", props)
      : null}
    <div data-testid="generic-content" data-guide={props?.guideKey ?? ""} />
  </>
));

export const tableOfContentsMock = vi.fn(
  ({ items, title }: { items?: Array<{ href: string; label: string }>; title?: string }) => (
    <nav data-testid="table-of-contents">
      {title ? <span data-testid="toc-title">{title}</span> : null}
      <ul>
        {(items ?? []).map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  ),
);

export const tagChipsMock = vi.fn(() => <div data-testid="tag-chips" />);
export const relatedGuidesMock = vi.fn(() => <div data-testid="related-guides" />);
export const imageGalleryMock = vi.fn(
  ({ items }: { items?: Array<{ src: string; alt: string; caption?: string }> }) => (
    <div data-testid="image-gallery" data-count={items?.length ?? 0} />
  ),
);

export const breadcrumbStructuredDataMock = vi.fn(
  ({ breadcrumb }: { breadcrumb?: unknown }) => (
    <div data-testid="breadcrumb-structured" data-breadcrumb={JSON.stringify(breadcrumb ?? null)} />
  ),
);

export const guidesTagsStructuredDataMock = vi.fn(
  ({ items }: { items?: unknown }) => (
    <div data-testid="guides-tags-structured-data" data-items={JSON.stringify(items ?? [])} />
  ),
);

export const articleStructuredDataMock = vi.fn(
  ({ headline, description }: { headline?: string; description?: string }) => (
    <div data-testid="article-structured" data-headline={headline ?? ""} data-description={description ?? ""} />
  ),
);

export const guideFaqJsonLdMock = vi.fn(
  ({ guideKey, fallback }: { guideKey: string; fallback?: (lang: string) => unknown }) => {
    if (typeof fallback === "function") {
      capturedFaqFallbacks.set(guideKey, fallback);
    }
    const lang = i18n.language || currentLanguage;
    const payload = typeof fallback === "function" ? fallback(lang) : undefined;
    const serialized = payload ? JSON.stringify(payload) : "";
    return (
      <>
        <div data-testid={`faq-json-${guideKey}`} data-fallback={serialized} />
        <div data-testid={`faq-jsonld-${guideKey}`} data-fallback={serialized} />
      </>
    );
  },
);

export const ensureGuideMocks = () => ({
  genericContent: genericContentMock,
  tableOfContents: tableOfContentsMock,
  tagChips: tagChipsMock,
  relatedGuides: relatedGuidesMock,
  imageGallery: imageGalleryMock,
  breadcrumbStructuredData: breadcrumbStructuredDataMock,
  guidesTagsStructuredData: guidesTagsStructuredDataMock,
  guideFaqJsonLd: guideFaqJsonLdMock,
  articleStructuredData: articleStructuredDataMock,
});

export const resetGuideMocks = () => {
  genericContentMock.mockReset();
  tableOfContentsMock.mockReset();
  tagChipsMock.mockReset();
  relatedGuidesMock.mockReset();
  imageGalleryMock.mockReset();
  breadcrumbStructuredDataMock.mockReset();
  guidesTagsStructuredDataMock.mockReset();
  guideFaqJsonLdMock.mockReset();
  articleStructuredDataMock.mockReset();
  capturedFaqFallbacks.clear();
};

export const setCurrentLanguage = (lang: string) => {
  currentLanguage = lang;
  try {
    (i18n as { language?: string }).language = lang;
  } catch {
    /* noop */
  }
};

export const setTranslations = (lang: string, ns: NamespaceKey, entries: Record<string, unknown>) => {
  const normalized = normalizeEntries(entries);
  const baseBundle =
    (i18n.getResourceBundle?.(lang, ns) as Record<string, unknown> | undefined) ?? {};
  const mergedBundle = mergeResources(baseBundle, normalized);
  if (typeof i18n.removeResourceBundle === "function") {
    i18n.removeResourceBundle(lang, ns);
  }
  // Avoid i18next deep-merge preserving old array entries when tests set [].
  i18n.addResourceBundle(lang, ns, mergedBundle, false, true);
  if (ns === "guides") {
    registerGuideContentOverride(lang, normalized);
    guideBackendOverrides[lang] = mergedBundle;
    if (process.env.DEBUG_GUIDE_TRANSLATIONS === "1") {
      const intro = (mergedBundle as { content?: Record<string, any> })?.content?.sunriseHike?.intro;
      // eslint-disable-next-line no-console -- Localised debug helper for failing coverage tests
      console.log(`[guides.test-utils] ${lang} guides intro`, intro);
    }
  }
  touchedBundles.add(`${lang}::${ns}`);
};

export const resetGuideTestState = () => {
  for (const bundleKey of touchedBundles) {
    const [lang, ns] = bundleKey.split("::");
    if (lang && ns) {
      i18n.removeResourceBundle(lang, ns);
    }
  }
  touchedBundles.clear();
  const store = (i18n as { store?: { data?: Record<string, unknown> } }).store?.data ?? {};
  for (const lang of Object.keys(store)) {
    if (i18n.hasResourceBundle?.(lang, "guides")) {
      i18n.removeResourceBundle(lang, "guides");
    }
    if (i18n.hasResourceBundle?.(lang, "guidesFallback")) {
      i18n.removeResourceBundle(lang, "guidesFallback");
    }
  }
  for (const key of Object.keys(guideBackendOverrides)) {
    delete guideBackendOverrides[key];
  }
  if (guideTestState.manualGuideContentOverrides) {
    guideTestState.manualGuideContentOverrides.clear();
  }
  resetGuideMocks();
  setCurrentLanguage("en");
};

export const createTranslator = (
  lang: string,
  namespaces: string[] | string,
  opts: { allowEnglishFallback?: boolean } = {},
): TFunction => {
  const nsList = Array.isArray(namespaces) ? namespaces : [namespaces];
  const allowEnglishFallback = opts.allowEnglishFallback !== false;
  const resolveOverride = (bundle: Record<string, unknown> | undefined, key: string): unknown => {
    if (!bundle) return undefined;
    return key.split(".").reduce<unknown>((acc, segment) => {
      if (!acc || typeof acc !== "object") return undefined;
      return (acc as Record<string, unknown>)[segment];
    }, bundle);
  };
  if (process.env.DEBUG_GUIDE_TRANSLATIONS === "1" && nsList.includes("guides")) {
    const active = i18n.getResource?.(lang, "guides", "content.sunriseHike.intro");
    const fallbackEn = i18n.getResource?.("en", "guides", "content.sunriseHike.intro");
    // eslint-disable-next-line no-console -- Localised debug helper for coverage tests
    console.log(`[guides.test-utils] store check lang=${lang}`, active, "en", fallbackEn);
  }
  const fixed = i18n.getFixedT?.(lang, nsList);
  if (typeof fixed === "function") {
    return ((key: string, options?: Record<string, unknown>) => {
      if (nsList.includes("guides")) {
        const override = resolveOverride(guideBackendOverrides[lang], key);
        if (override !== undefined) return override;
        if (allowEnglishFallback && lang !== "en") {
          const enOverride = resolveOverride(guideBackendOverrides.en, key);
          if (enOverride !== undefined) return enOverride;
        }
      }
      return (fixed as TFunction)(key, options);
    }) as TFunction;
  }
  return ((key: string) => key) as unknown as TFunction;
};

export const renderWithRouter = (ui: ReactElement, route?: string) => {
  const resolvedRoute = route ?? `/${currentLanguage}`;
  return renderWithProviders(ui, { route: resolvedRoute });
};

vi.mock("@/components/guides/GenericContent", () => ({
  __esModule: true,
  default: genericContentMock,
}));
vi.mock("@/components/guides/TableOfContents", () => ({
  __esModule: true,
  default: tableOfContentsMock,
}));
vi.mock("@/components/guides/TagChips", () => ({
  __esModule: true,
  default: tagChipsMock,
}));
vi.mock("@/components/guides/RelatedGuides", () => ({
  __esModule: true,
  default: relatedGuidesMock,
}));
vi.mock("@/components/guides/ImageGallery", () => ({
  __esModule: true,
  default: imageGalleryMock,
}));
vi.mock("@/components/seo/BreadcrumbStructuredData", () => ({
  __esModule: true,
  default: breadcrumbStructuredDataMock,
}));
vi.mock("@/components/seo/GuidesTagsStructuredData", () => ({
  __esModule: true,
  default: guidesTagsStructuredDataMock,
}));
vi.mock("@/components/seo/ArticleStructuredData", () => ({
  __esModule: true,
  default: articleStructuredDataMock,
}));
vi.mock("@/components/seo/GuideFaqJsonLd", () => ({
  __esModule: true,
  default: guideFaqJsonLdMock,
}));